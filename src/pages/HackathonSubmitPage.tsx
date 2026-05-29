import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Timer, Rocket, GitBranch, Trophy,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { hackathonApi } from "@/lib/api";
import type { Hackathon, HackathonTeam } from "@/types/models";
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

// ── ScoreRing ──────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 9 ? "#16a34a" : score >= 8 ? "#2563eb" : score >= 7 ? "#d97706" : "#94a3b8";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center w-32 h-32">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score.toFixed(1)}</span>
        <span className="text-xs text-slate-400">/ 10</span>
      </div>
    </div>
  );
}

// ── ScoreBar ───────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600 capitalize font-medium">{label}</span>
        <span className="font-bold text-slate-800">{value}/10</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── SubmissionResult ───────────────────────────────────────────────────────────
interface SubmitResult {
  score: number;
  review: string;
  scoringDetails: {
    codeQuality: number;
    relevance: number;
    innovation: number;
    completeness: number;
  };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HackathonSubmitPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [myTeam, setMyTeam] = useState<HackathonTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ githubUrl: "", zipUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await hackathonApi.getBySlug(slug);
      const h: Hackathon = data.hackathon ?? data;
      setHackathon(h);

      if (!user._id) {
        navigate(`/hackathon/${slug}`, { replace: true });
        return;
      }

      try {
        const t = await hackathonApi.getMyTeam(h._id);
        const team: HackathonTeam = t.team ?? t;
        if (!team || !team.selectedPS) {
          navigate(`/hackathon/${slug}`, { replace: true });
          return;
        }
        setMyTeam(team);

        // If already submitted, check for existing score
        if (team.isSubmitted) {
          // Try to get submission result from leaderboard
          try {
            const lb = await hackathonApi.getLeaderboard(h._id);
            const entries: Array<{
              teamName: string;
              score: number;
              review: string;
              scoringDetails: SubmitResult["scoringDetails"];
            }> = lb.leaderboard ?? lb ?? [];
            const myEntry = entries.find((e) => e.teamName === team.teamName);
            if (myEntry) {
              setResult({
                score: myEntry.score,
                review: myEntry.review,
                scoringDetails: myEntry.scoringDetails,
              });
            }
          } catch { /* no result yet */ }
        }
      } catch {
        navigate(`/hackathon/${slug}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug, navigate, user._id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathon || !myTeam) return;
    if (!form.githubUrl.trim()) { setError("GitHub URL is required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await hackathonApi.submit(hackathon._id, {
        githubUrl: form.githubUrl.trim(),
        zipUrl: form.zipUrl.trim() || undefined,
      });
      setResult(res.result ?? {
        score: res.score,
        review: res.review ?? res.aiReview,
        scoringDetails: res.scoringDetails,
      });
      // Refresh team state
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
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

  if (!hackathon || !myTeam) return null;

  const psTitle =
    myTeam.selectedPS && typeof myTeam.selectedPS === "object"
      ? myTeam.selectedPS.title
      : "Your Problem Statement";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to={`/hackathon/${slug}`}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Hackathon
          </Link>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{hackathon.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm">
              <GitBranch className="w-3.5 h-3.5 text-violet-300" />
              <span className="font-semibold">{psTitle}</span>
            </div>
            {hackathon.status === "active" && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-sm">
                <Timer className="w-3.5 h-3.5 text-violet-300" />
                <Countdown target={hackathon.endTime} />
                <span className="text-slate-400 text-xs font-sans">remaining</span>
              </div>
            )}
          </div>

          <p className="text-slate-300 text-sm">
            Team: <span className="font-bold text-white">{myTeam.teamName}</span>
          </p>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Already submitted + scored */}
        {(myTeam.isSubmitted && result) ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-black text-green-800">Solution submitted!</p>
                <p className="text-green-700 text-sm">Your submission has been received and scored by AI.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Your Score
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={result.score} />
                <div className="flex-1 w-full space-y-3">
                  <ScoreBar label="Code Quality" value={result.scoringDetails.codeQuality} />
                  <ScoreBar label="Relevance" value={result.scoringDetails.relevance} />
                  <ScoreBar label="Innovation" value={result.scoringDetails.innovation} />
                  <ScoreBar label="Completeness" value={result.scoringDetails.completeness} />
                </div>
              </div>

              {result.review && (
                <div className="mt-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">AI Review</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.review}
                  </div>
                </div>
              )}
            </div>

            <Link
              to={`/hackathon/${slug}`}
              className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:underline text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> View Leaderboard
            </Link>
          </div>
        ) : myTeam.isSubmitted ? (
          /* Submitted but no score yet */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="font-black text-slate-900 text-xl mb-2">Submission Received!</h2>
            <p className="text-slate-500 text-sm">
              Your solution is being reviewed. Check back later for your AI score.
            </p>
          </div>
        ) : (
          /* Submission form */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-xl flex items-center gap-2">
                <Rocket className="w-5 h-5 text-violet-600" /> Submit Your Solution
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Submit your GitHub repository to get an AI score.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  GitHub Repository URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
                    placeholder="https://github.com/username/repo"
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Make sure the repository is public.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Zip / Drive URL <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.zipUrl}
                  onChange={(e) => setForm((f) => ({ ...f, zipUrl: e.target.value }))}
                  placeholder="Optional: Google Drive / Dropbox link to .zip"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Once submitted, you cannot resubmit. Make sure your repo is complete.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting & Scoring…</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Submit Solution</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Scoring result after fresh submit */}
        {result && !myTeam.isSubmitted && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> AI Score
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={result.score} />
              <div className="flex-1 w-full space-y-3">
                <ScoreBar label="Code Quality" value={result.scoringDetails.codeQuality} />
                <ScoreBar label="Relevance" value={result.scoringDetails.relevance} />
                <ScoreBar label="Innovation" value={result.scoringDetails.innovation} />
                <ScoreBar label="Completeness" value={result.scoringDetails.completeness} />
              </div>
            </div>
            {result.review && (
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">AI Review</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.review}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
