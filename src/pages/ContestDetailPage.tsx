import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import { contestApi } from "@/lib/api";
import { Trophy, Clock, Users, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Crown, Code2, Plus, Trash2, X, ChevronRight, Star, ListChecks } from "lucide-react";

type ContestStatus = "upcoming" | "ongoing" | "ended";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  topicTag: string;
  description: string;
  examples: Example[];
  starterCode: Record<string, string>;
  testCases: TestCase[];
}

interface ContestProblem {
  problem: Problem;
  points: number;
  order: number;
}

interface Contest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  isRegistered: boolean;
  problemCount: number;
  totalRegistrations: number;
  banner: string;
  problems: ContestProblem[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalScore: number;
  penaltyTime: number;
  solvedCount: number;
  problems: Record<string, { accepted: boolean; attempts: number; acceptedAt: number }>;
}

interface Submission {
  _id: string;
  problem?: { title: string };
  status: string;
  attemptNumber: number;
  language: string;
  timeFromStart: number;
  score: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

const DIFF_CLS: Record<string, string> = {
  Easy: "text-green-600 bg-green-50 border-green-200",
  Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtPenalty(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Countdown({ target, prefix }: { target: string; prefix: string }) {
  const [rem, setRem] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date(target).getTime() - Date.now();
      if (d <= 0) {
        setRem("");
        return;
      }
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setRem(`${h > 0 ? `${h}h ` : ""}${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!rem) return null;
  return (
    <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-orange-600">
      <Clock className="w-4 h-4" />
      {prefix}: {rem}
    </span>
  );
}

function AddProblemModal({ contestId, onAdded, onClose }: { contestId: string; onAdded: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState({
    problemSlug: "",
    points: 100,
    order: 0,
    title: "",
    description: "",
    difficulty: "Medium",
    topicTag: "Arrays",
    examples: [{ input: "", output: "", explanation: "" }],
    testCases: [{ input: "", expectedOutput: "", isHidden: false }],
    starterCode: { python: "", javascript: "", cpp: "", java: "" },
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    try {
      if (mode === "existing") {
        await contestApi.addProblem(contestId, { problemSlug: form.problemSlug, points: form.points, order: form.order });
      } else {
        await contestApi.createProblem(contestId, {
          title: form.title,
          description: form.description,
          difficulty: form.difficulty,
          topicTag: form.topicTag,
          examples: form.examples,
          testCases: form.testCases,
          starterCode: form.starterCode,
          points: form.points,
          order: form.order,
        });
      }
      onAdded();
      onClose();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed";
      setErr(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-slate-900">Add Problem to Contest</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
            {(["existing", "new"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
                {m === "existing" ? "Add Existing" : "Create New"}
              </button>
            ))}
          </div>

          {mode === "existing" ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Problem Slug *</label>
              <input value={form.problemSlug} onChange={(e) => set("problemSlug", e.target.value)} placeholder="e.g. two-sum" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Topic Tag</label>
                  <input value={form.topicTag} onChange={(e) => set("topicTag", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Test cases, examples, and starter code can be added later by editing the problem.</p>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Points</label>
              <input type="number" value={form.points} onChange={(e) => set("points", Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Order</label>
              <input type="number" value={form.order} onChange={(e) => set("order", Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {err}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Problem
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContestDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"problems" | "leaderboard" | "submissions">("problems");
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isAdmin = JSON.parse(localStorage.getItem("user") || "{}").role === "admin";
  const isLoggedIn = !!localStorage.getItem("token");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadContest = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    contestApi
      .getBySlug(slug)
      .then((data: Contest) => {
        setContest(data);
        setRegistered(data.isRegistered);
      })
      .catch(() => navigate("/contests"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  useEffect(() => {
    loadContest();
  }, [loadContest]);

  const loadLeaderboard = useCallback(() => {
    if (!slug) return;
    setLbLoading(true);
    contestApi
      .getLeaderboard(slug)
      .then((data: LeaderboardResponse) => setLeaderboard(data.leaderboard))
      .catch(() => {})
      .finally(() => setLbLoading(false));
  }, [slug]);

  const loadMySubmissions = useCallback(() => {
    if (!slug || !isLoggedIn) return;
    setSubLoading(true);
    contestApi
      .getMySubmissions(slug)
      .then((data: Submission[]) => setMySubmissions(data))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [slug, isLoggedIn]);

  useEffect(() => {
    if (tab === "leaderboard") loadLeaderboard();
    if (tab === "submissions") loadMySubmissions();
  }, [tab, loadLeaderboard, loadMySubmissions]);

  const handleRegister = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setRegistering(true);
    try {
      await contestApi.register(slug!);
      setRegistered(true);
      setContest((c) => (c ? { ...c, totalRegistrations: c.totalRegistrations + 1 } : c));
      showToast("Registered successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      showToast(errorMessage, false);
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!contest || !confirm("Remove this problem from the contest?")) return;
    try {
      await contestApi.removeProblem(contest._id, problemId);
      loadContest();
      showToast("Problem removed");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed";
      showToast(errorMessage, false);
    }
  };

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    accepted: { label: "Accepted", cls: "text-green-600 bg-green-50 border-green-200" },
    wrong_answer: { label: "Wrong Answer", cls: "text-red-600 bg-red-50 border-red-200" },
    runtime_error: { label: "Runtime Error", cls: "text-orange-600 bg-orange-50 border-orange-200" },
    compile_error: { label: "Compile Error", cls: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    pending: { label: "Pending", cls: "text-slate-500 bg-slate-50 border-slate-200" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!contest) return null;

  const sortedProblems = [...contest.problems].sort((a, b) => a.order - b.order);
  const canEnter = (contest.status === "ongoing" && registered) || isAdmin;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Banner */}
      <div className={`bg-linear-to-br ${contest.banner} text-white`}>
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-10">
          <Link to="/contests" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-semibold mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Contests
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">{contest.title}</h1>
              {contest.description && <p className="text-white/80 text-base mb-4">{contest.description}</p>}
              <div className="flex items-center gap-4 flex-wrap text-sm text-white/70 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {fmt(contest.startTime)} – {fmt(contest.endTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  {contest.problemCount} problems
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {contest.totalRegistrations} registered
                </span>
                {contest.status === "upcoming" && <Countdown target={contest.startTime} prefix="Starts in" />}
                {contest.status === "ongoing" && <Countdown target={contest.endTime} prefix="Ends in" />}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              {contest.status !== "ended" && !registered && (
                <button onClick={handleRegister} disabled={registering} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:bg-white/90 transition-all disabled:opacity-70">
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  Register Now
                </button>
              )}
              {registered && contest.status !== "ended" && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Registered
                </div>
              )}
              {canEnter && sortedProblems.length > 0 && (
                <Link to={`/contests/${contest.slug}/solve/${sortedProblems[0].problem.slug}`} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold shadow-lg transition-all">
                  <Code2 className="w-4 h-4" />
                  Enter Contest
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {([{ key: "problems" as const, label: "Problems", icon: <ListChecks className="w-4 h-4" /> }, { key: "leaderboard" as const, label: "Leaderboard", icon: <Crown className="w-4 h-4" /> }, ...(isLoggedIn ? [{ key: "submissions" as const, label: "My Submissions", icon: <Code2 className="w-4 h-4" /> }] : [])] as const).map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-3 sm:px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Problems Tab ── */}
        {tab === "problems" && (
          <div>
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowAddProblem(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Problem
                </button>
              </div>
            )}
            {sortedProblems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No problems added yet</p>
                {isAdmin && <p className="text-sm mt-1">Click "Add Problem" to get started</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedProblems.map((cp, i) => {
                  const p = cp.problem;
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <div key={p._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-lg shrink-0">{letter}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-slate-900">{p.title}</h3>
                          {p.difficulty && <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${DIFF_CLS[p.difficulty] || "text-slate-600 bg-slate-50 border-slate-200"}`}>{p.difficulty}</span>}
                          {p.topicTag && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{p.topicTag}</span>}
                        </div>
                        <p className="text-sm text-slate-500 font-semibold">{cp.points} points</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && (
                          <button onClick={() => handleRemoveProblem(p._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {canEnter ? (
                          <Link to={`/contests/${contest.slug}/solve/${p.slug}`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                            Solve <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold">{contest.status === "upcoming" ? "Not started" : "View"}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard Tab ── */}
        {tab === "leaderboard" && (
          <div>
            {lbLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Leaderboard is empty</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-bold text-slate-500 w-12">Rank</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500">Participant</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-500">Score</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-right font-bold text-slate-500">Penalty</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-500">Solved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.userId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-400">{entry.rank <= 3 ? <span className={entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-slate-400" : "text-orange-600"}>{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span> : entry.rank}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{entry.username}</td>
                        <td className="px-4 py-3 text-right font-black text-primary">{entry.totalScore}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-right font-mono text-slate-500">{fmtPenalty(entry.penaltyTime)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700">
                          {entry.solvedCount}/{sortedProblems.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── My Submissions Tab ── */}
        {tab === "submissions" && (
          <div>
            {subLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((sub: Submission) => {
                  const st = STATUS_LABEL[sub.status] || { label: sub.status, cls: "text-slate-500 bg-slate-50 border-slate-200" };
                  return (
                    <div key={sub._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-slate-900">{sub.problem?.title || "Problem"}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Attempt #{sub.attemptNumber} · {sub.language} · {fmtPenalty(sub.timeFromStart)} from start
                          {sub.score > 0 && <span className="ml-2 text-primary font-bold">+{sub.score} pts</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddProblem && contest && <AddProblemModal contestId={contest._id} onAdded={loadContest} onClose={() => setShowAddProblem(false)} />}
    </div>
  );
}
