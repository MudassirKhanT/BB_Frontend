import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Trophy, Users, Clock, Calendar, Lock,
  ChevronRight, CheckCircle2, Star, Code2, GitBranch,
  Zap, Timer, Rocket, Plus, X, Loader2, ExternalLink,
  ArrowLeft, AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { hackathonApi } from "@/lib/api";
import type {
  Hackathon,
  HackathonPS,
  HackathonTeam,
  HackathonLeaderboardEntry,
} from "@/types/models";
import { getErrorMessage } from "@/types/models";

// ── Countdown ──────────────────────────────────────────────────────────────────
function Countdown({ target }: { target: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  return <span>{timeLeft}</span>;
}

// ── Difficulty badge ───────────────────────────────────────────────────────────
function DiffBadge({ diff }: { diff: "Easy" | "Medium" | "Hard" }) {
  const cls =
    diff === "Easy"
      ? "bg-green-100 text-green-700 border-green-200"
      : diff === "Medium"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {diff}
    </span>
  );
}

// ── Score color ────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 9) return "text-green-600";
  if (score >= 8) return "text-blue-600";
  if (score >= 7) return "text-amber-600";
  return "text-slate-500";
}

// ── ScoreBar ───────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 capitalize">{label}</span>
        <span className="font-bold text-slate-700">{value}/10</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: "upcoming" | "active" | "ended" }) {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
        <Timer className="w-3 h-3" />
        UPCOMING
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-400 text-xs font-bold">
      ENDED
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HackathonPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [problemStatements, setProblemStatements] = useState<HackathonPS[]>([]);
  const [myTeam, setMyTeam] = useState<HackathonTeam | null>(null);
  const [leaderboard, setLeaderboard] = useState<HackathonLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ps" | "leaderboard" | "myteam">("ps");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPSModal, setShowPSModal] = useState<HackathonPS | null>(null);
  const [selectingPS, setSelectingPS] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [teamForm, setTeamForm] = useState<{ teamName: string; memberEmails: string[] }>({
    teamName: "",
    memberEmails: [""],
  });
  const [registering, setRegistering] = useState(false);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!user._id;

  const showToast = (text: string, ok: boolean) => {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    // No slug — fetch all hackathons and redirect to the first one
    if (!slug) {
      try {
        const list: Hackathon[] = await hackathonApi.getAll();
        if (list.length > 0) {
          navigate(`/hackathon/${list[0].slug}`, { replace: true });
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
      return;
    }

    try {
      const data = await hackathonApi.getBySlug(slug);
      const h: Hackathon = data.hackathon ?? data;
      const ps: HackathonPS[] = data.problemStatements ?? [];
      setHackathon(h);
      setProblemStatements(ps);

      // load leaderboard
      try {
        const lb = await hackathonApi.getLeaderboard(h._id);
        setLeaderboard(lb.leaderboard ?? lb ?? []);
      } catch { /* leaderboard may be empty */ }

      // load my team
      if (isLoggedIn) {
        try {
          const t = await hackathonApi.getMyTeam(h._id);
          setMyTeam(t.team ?? t ?? null);
        } catch { /* no team yet */ }
      }
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setLoading(false);
    }
  }, [slug, isLoggedIn]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Register team ──────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!hackathon) return;
    if (!teamForm.teamName.trim()) { showToast("Team name is required", false); return; }
    setRegistering(true);
    try {
      const emails = teamForm.memberEmails.filter((e) => e.trim());
      await hackathonApi.registerTeam({
        hackathonId: hackathon._id,
        teamName: teamForm.teamName.trim(),
        memberEmails: emails,
      });
      showToast("Team registered successfully!", true);
      setShowRegisterModal(false);
      setTeamForm({ teamName: "", memberEmails: [""] });
      await loadData();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setRegistering(false);
    }
  };

  // ── Select PS ──────────────────────────────────────────────────────────────
  const handleSelectPS = async (ps: HackathonPS) => {
    if (!hackathon) return;
    setSelectingPS(true);
    try {
      await hackathonApi.selectPS(hackathon._id, ps._id);
      showToast("Problem statement selected!", true);
      setShowPSModal(null);
      await loadData();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setSelectingPS(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <Trophy className="w-14 h-14 text-violet-400 opacity-40" />
          <p className="text-white text-xl font-black">No Hackathons Yet</p>
          <p className="text-slate-400 text-sm max-w-sm">
            There are no active or upcoming hackathons right now. Check back soon!
          </p>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mt-2">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const canRegister =
    isLoggedIn &&
    !myTeam &&
    hackathon.isStarted &&
    hackathon.status !== "ended";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white transition-all ${
            toastMsg.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toastMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toastMsg.text}
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-900 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-48 h-48 bg-violet-800/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <StatusBadge status={hackathon.status} />
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
                {hackathon.title}
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                {hackathon.description}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span>Team: {hackathon.minTeamSize}–{hackathon.maxTeamSize} members</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>48h hackathon</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <span>Theme: {hackathon.theme}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span>{new Date(hackathon.startTime).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Countdown + CTA row */}
              <div className="flex items-center gap-3 flex-wrap mb-6">
                {!hackathon.isStarted && (
                  <div className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/70 text-sm font-semibold">
                    <Timer className="w-4 h-4 text-violet-300" />
                    Waiting for admin to start
                  </div>
                )}
                {hackathon.isStarted && hackathon.status === "active" && (
                  <div className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-mono font-bold text-lg">
                    <Timer className="w-5 h-5 text-violet-300" />
                    <Countdown target={hackathon.endTime} />
                    <span className="text-slate-400 text-xs font-sans font-normal">remaining</span>
                  </div>
                )}

                {canRegister && (
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-900/40 transition-all"
                  >
                    <Rocket className="w-4 h-4" /> Register Your Team
                  </button>
                )}
                {isLoggedIn && myTeam && (
                  <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Registered as {myTeam.teamName}
                  </div>
                )}
                {!isLoggedIn && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all"
                  >
                    Login to Register
                  </Link>
                )}
              </div>
            </div>

            {/* Right side decorative card */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Starts</span>
                    <span className="font-semibold">{new Date(hackathon.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Ends</span>
                    <span className="font-semibold">{new Date(hackathon.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Team Size</span>
                    <span className="font-semibold">{hackathon.minTeamSize}–{hackathon.maxTeamSize}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Theme</span>
                    <span className="font-semibold">{hackathon.theme}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {(["ps", "leaderboard", "myteam"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-4 text-sm font-bold border-b-2 transition-all ${
                  tab === t
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "ps" ? "Problem Statements" : t === "leaderboard" ? "Leaderboard" : "My Team"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* ── PS Tab ──────────────────────────────────────────────────── */}
        {tab === "ps" && (
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Problem Statements
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {problemStatements.length} challenge{problemStatements.length !== 1 ? "s" : ""} available
              {myTeam?.selectedPS ? ` — your team selected "${myTeam.selectedPS.title}"` : ""}
            </p>

            {problemStatements.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Code2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No problem statements published yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {problemStatements.map((ps) => {
                  const isMyPS = myTeam?.selectedPS && (
                    typeof myTeam.selectedPS === "object"
                      ? myTeam.selectedPS._id === ps._id
                      : myTeam.selectedPS === ps._id
                  );
                  return (
                    <div
                      key={ps._id}
                      className={`relative bg-white rounded-2xl border shadow-sm transition-all duration-200 flex flex-col ${
                        ps.isLocked && !isMyPS
                          ? "opacity-50 cursor-not-allowed border-slate-200"
                          : "border-slate-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      } ${isMyPS ? "ring-2 ring-violet-500 border-violet-300" : ""}`}
                    >
                      {/* Locked overlay badge */}
                      {ps.isLocked && !isMyPS && (
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <Lock className="w-3 h-3" /> Taken
                          </span>
                        </div>
                      )}
                      {isMyPS && (
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                            <CheckCircle2 className="w-3 h-3" /> Your Choice
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <DiffBadge diff={ps.difficulty} />
                          <span className="text-xs text-slate-400 font-medium">#{ps.order}</span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base mb-2 leading-snug pr-12">
                          {ps.title}
                        </h3>

                        <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3 mb-4">
                          {ps.description}
                        </p>

                        {/* Tech stack pills */}
                        {ps.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {ps.techStack.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                            {ps.techStack.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                                +{ps.techStack.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Lock info */}
                        {ps.isLocked && ps.lockedByTeam && !isMyPS && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                            <Lock className="w-3 h-3" />
                            Locked by {ps.lockedByTeam.teamName}
                          </p>
                        )}

                        <div className="mt-auto">
                          {!ps.isLocked || isMyPS ? (
                            <button
                              onClick={() => setShowPSModal(ps)}
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all"
                            >
                              View Details <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl">
                              <Lock className="w-4 h-4" /> Taken
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard Tab ──────────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-7 h-7 text-yellow-500" />
              <div>
                <h2 className="text-xl font-black text-slate-900">Leaderboard</h2>
                <p className="text-slate-500 text-sm">{leaderboard.length} team{leaderboard.length !== 1 ? "s" : ""} scored</p>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Leaderboard will be available after the hackathon ends.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 text-center">
                          {entry.rank === 1 ? (
                            <span className="text-3xl">🥇</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-3xl">🥈</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-3xl">🥉</span>
                          ) : (
                            <span className="text-2xl font-black text-slate-400">#{entry.rank}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-900 text-base">{entry.teamName}</h3>
                            <DiffBadge diff={entry.difficulty} />
                          </div>
                          <p className="text-sm text-slate-500 mb-1 font-medium">{entry.psTitle}</p>
                          <p className="text-xs text-slate-400">{entry.memberEmails.join(", ")}</p>
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-3xl font-black ${scoreColor(entry.score)}`}>
                            {entry.score.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-400">/ 10</p>
                          {entry.githubUrl && (
                            <a
                              href={entry.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-xs text-slate-500 hover:text-violet-600 transition-colors"
                            >
                              <GitBranch className="w-3 h-3" /> GitHub
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Score bars */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(entry.scoringDetails).map(([k, v]) => (
                          <ScoreBar key={k} label={k} value={v} />
                        ))}
                      </div>

                      {/* Review (expandable) */}
                      {entry.review && (
                        <div className="mt-4">
                          <button
                            onClick={() => setExpandedReview(expandedReview === idx ? null : idx)}
                            className="text-xs text-violet-600 font-semibold hover:underline"
                          >
                            {expandedReview === idx ? "Hide" : "Show"} AI Review
                          </button>
                          {expandedReview === idx && (
                            <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-200 leading-relaxed whitespace-pre-wrap">
                              {entry.review}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── My Team Tab ──────────────────────────────────────────────── */}
        {tab === "myteam" && (
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-6">My Team</h2>

            {!isLoggedIn ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-semibold mb-4">Please login to see your team.</p>
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-500 transition-all"
                >
                  Login
                </Link>
              </div>
            ) : !myTeam ? (
              <div className="text-center py-16">
                <Rocket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-700 font-black text-lg mb-1">You haven't registered yet</p>
                <p className="text-slate-500 text-sm mb-6">Form a team to participate in this hackathon.</p>
                {canRegister ? (
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all"
                  >
                    Register Your Team
                  </button>
                ) : (
                  <p className="text-slate-400 text-sm">Registration is {hackathon.status === "ended" ? "closed" : "not open yet"}.</p>
                )}
              </div>
            ) : (
              <div className="max-w-lg">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">{myTeam.teamName}</h3>
                      <p className="text-slate-500 text-xs">
                        {myTeam.isSubmitted ? (
                          <span className="text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Submitted
                          </span>
                        ) : "Not submitted yet"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-5">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Members</p>
                      <div className="space-y-1">
                        {myTeam.memberEmails.map((email) => (
                          <div key={email} className="flex items-center gap-2 text-slate-700">
                            <Star className="w-3 h-3 text-violet-400" />
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Selected Problem</p>
                      {myTeam.selectedPS ? (
                        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                          <GitBranch className="w-4 h-4 text-violet-600 flex-shrink-0" />
                          <span className="font-semibold text-violet-800">
                            {typeof myTeam.selectedPS === "object"
                              ? myTeam.selectedPS.title
                              : myTeam.selectedPS}
                          </span>
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">
                          No problem selected yet.{" "}
                          <button
                            onClick={() => setTab("ps")}
                            className="text-violet-600 font-semibold hover:underline"
                          >
                            Choose one →
                          </button>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  {myTeam.selectedPS && !myTeam.isSubmitted && hackathon.status === "active" && (
                    <Link
                      to={`/hackathon/${hackathon.slug}/submit`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all"
                    >
                      <Rocket className="w-4 h-4" /> Submit Solution
                    </Link>
                  )}
                  {myTeam.isSubmitted && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl">
                      <CheckCircle2 className="w-4 h-4" /> Solution Submitted!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Register Modal ────────────────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-lg">Register Your Team</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Team Name</label>
                <input
                  type="text"
                  value={teamForm.teamName}
                  onChange={(e) => setTeamForm((f) => ({ ...f, teamName: e.target.value }))}
                  placeholder="Enter your team name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Member Emails
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  You + member emails = total team size (2–{hackathon.maxTeamSize}).
                </p>
                <div className="space-y-2">
                  {teamForm.memberEmails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const next = [...teamForm.memberEmails];
                          next[i] = e.target.value;
                          setTeamForm((f) => ({ ...f, memberEmails: next }));
                        }}
                        placeholder={`Member ${i + 1} email`}
                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                      {teamForm.memberEmails.length > 1 && (
                        <button
                          onClick={() => {
                            const next = teamForm.memberEmails.filter((_, j) => j !== i);
                            setTeamForm((f) => ({ ...f, memberEmails: next }));
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {teamForm.memberEmails.length < hackathon.maxTeamSize - 1 && (
                  <button
                    onClick={() => setTeamForm((f) => ({ ...f, memberEmails: [...f.memberEmails, ""] }))}
                    className="mt-2 flex items-center gap-1.5 text-sm text-violet-600 font-semibold hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all"
              >
                {registering ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Register Team</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PS Detail Modal ───────────────────────────────────────────── */}
      {showPSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <DiffBadge diff={showPSModal.difficulty} />
                </div>
                <h2 className="font-black text-slate-900 text-xl leading-snug">{showPSModal.title}</h2>
              </div>
              <button
                onClick={() => setShowPSModal(null)}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Tech stack */}
              {showPSModal.techStack.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {showPSModal.techStack.map((t) => (
                      <span
                        key={t}
                        className="text-sm px-3 py-1 rounded-full bg-violet-100 text-violet-700 font-medium border border-violet-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-200">
                  {showPSModal.description}
                </div>
              </div>

              {/* Locked info */}
              {showPSModal.isLocked && showPSModal.lockedByTeam && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  Locked by team: <strong>{showPSModal.lockedByTeam.teamName}</strong>
                </div>
              )}
            </div>

            {/* Select PS button */}
            <div className="p-6 pt-0 border-t border-slate-100 flex-shrink-0">
              {myTeam && !myTeam.selectedPS && !showPSModal.isLocked && hackathon.status === "active" && (
                <button
                  onClick={() => handleSelectPS(showPSModal)}
                  disabled={selectingPS}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all"
                >
                  {selectingPS ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Selecting…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Select This Problem Statement</>
                  )}
                </button>
              )}
              {myTeam?.selectedPS && (
                <p className="text-center text-sm text-slate-500">
                  You already have a problem statement selected.
                </p>
              )}
              {!myTeam && isLoggedIn && (
                <p className="text-center text-sm text-slate-500">
                  Register a team first to select this problem statement.
                </p>
              )}
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all"
                >
                  Login to Select
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
