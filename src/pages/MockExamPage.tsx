import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, Send, BookOpen, BarChart3,
  ArrowLeft, Trophy,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Question {
  _id: string;
  section: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  selected?: number;
  isCorrect?: boolean;
}

interface Exam {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  duration: number;
  passingScore: number;
  banner: string;
}

interface Sections { aptitude: Question[]; communication: Question[]; coding: Question[]; sql: Question[] }

interface SubmitResult {
  score: number;
  total: number;
  percentage: number;
  sectionScores: Record<string, { correct: number; total: number }>;
  timeTaken: number;
  review: Question[];
}

const SECTION_META: Record<string, { label: string; color: string; bg: string }> = {
  aptitude:      { label: "Aptitude",      color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  communication: { label: "Communication", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  coding:        { label: "Coding",        color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  sql:           { label: "SQL",           color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
};

const SECTION_ORDER = ["aptitude", "communication", "coding", "sql"] as const;

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Result View ───────────────────────────────────────────────────────────────
function ResultView({ result, exam, onReview }: { result: SubmitResult; exam: Exam; onReview: () => void }) {
  const passed = result.percentage >= exam.passingScore;
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className={`bg-gradient-to-br ${exam.banner} text-white py-12 px-4`}>
        <div className="max-w-3xl mx-auto text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? "bg-green-400/30 border-2 border-green-300" : "bg-red-400/30 border-2 border-red-300"}`}>
            {passed ? <Trophy className="w-10 h-10 text-yellow-300" /> : <XCircle className="w-10 h-10 text-red-300" />}
          </div>
          <h1 className="text-3xl font-black mb-2">{passed ? "Congratulations!" : "Better luck next time"}</h1>
          <p className="text-white/80 text-lg mb-4">{exam.title}</p>
          <div className="text-4xl sm:text-6xl font-black mb-1">{result.percentage}%</div>
          <p className="text-white/70">{result.score}/{result.total} correct · {fmt(result.timeTaken)} taken</p>
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full font-bold text-sm ${passed ? "bg-green-400/30 text-green-100" : "bg-red-400/30 text-red-100"}`}>
            {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {passed ? `Passed (Required: ${exam.passingScore}%)` : `Failed (Required: ${exam.passingScore}%)`}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Section breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Section Breakdown
          </h2>
          <div className="space-y-4">
            {SECTION_ORDER.map((sec) => {
              const ss = result.sectionScores[sec];
              if (!ss) return null;
              const p = ss.total > 0 ? Math.round((ss.correct / ss.total) * 100) : 0;
              const m = SECTION_META[sec];
              return (
                <div key={sec}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className={m.color}>{m.label}</span>
                    <span className="text-slate-600">{ss.correct}/{ss.total} ({p}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p >= 70 ? "bg-green-500" : p >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                      style={{ width: `${p}%`, transition: "width 0.8s ease" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review button */}
        <div className="flex gap-3">
          <button onClick={onReview}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors">
            <BookOpen className="w-4 h-4" /> Review Answers
          </button>
          <Link to="/mock-assessments"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Exams
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Review View ───────────────────────────────────────────────────────────────
function ReviewView({ result, onBack }: { result: SubmitResult; onBack: () => void }) {
  const [section, setSection] = useState<string>(SECTION_ORDER[0]);
  const bySec: Record<string, Question[]> = {};
  SECTION_ORDER.forEach((s) => { bySec[s] = result.review.filter((q) => q.section === s); });
  const questions = bySec[section] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>
        <h1 className="text-2xl font-black text-slate-900 mb-5">Answer Review</h1>

        {/* Section tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {SECTION_ORDER.map((s) => {
            const m = SECTION_META[s];
            const qs = bySec[s] || [];
            const correct = qs.filter((q) => q.isCorrect).length;
            return (
              <button key={s} onClick={() => setSection(s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${section === s ? `${m.bg} ${m.color} border-current` : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {m.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${section === s ? "" : "bg-slate-100"}`}>
                  {correct}/{qs.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {questions.map((q, i) => (
            <div key={q._id} className={`bg-white rounded-2xl border shadow-sm p-5 ${q.isCorrect ? "border-green-200" : "border-red-200"}`}>
              <div className="flex items-start gap-3 mb-4">
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm font-black shrink-0 ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">{q.question}</p>
              </div>
              <div className="space-y-2 mb-4">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctAnswer;
                  const isSelected = oi === q.selected;
                  let cls = "border-slate-200 bg-slate-50 text-slate-600";
                  if (isCorrect) cls = "border-green-500 bg-green-50 text-green-800 font-semibold";
                  else if (isSelected && !isCorrect) cls = "border-red-400 bg-red-50 text-red-700";
                  return (
                    <div key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${cls}`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${isCorrect ? "border-green-500 bg-green-500 text-white" : isSelected ? "border-red-400 bg-red-400 text-white" : "border-slate-300"}`}>
                        {isCorrect ? "✓" : isSelected ? "✗" : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                      {isSelected && !isCorrect && <span className="ml-auto text-xs text-red-500 font-bold">Your answer</span>}
                      {isCorrect && <span className="ml-auto text-xs text-green-600 font-bold">Correct</span>}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                  <span className="font-bold">Explanation: </span>{q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Exam Page ────────────────────────────────────────────────────────────
export default function MockExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<Sections | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(SECTION_ORDER[0]);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // questionId → selectedIndex
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [view, setView] = useState<"exam" | "result" | "review">("exam");
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    if (!id) return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/mock/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.myAttempt) {
          // Already attempted — load result
          fetch(`${API_BASE}/mock/${id}/my-result`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((res) => { setExam(data.exam); setResult(res); setView("result"); });
        } else {
          setExam(data.exam);
          setSections(data.sections);
          setTimeLeft((data.exam.duration || 60) * 60);
        }
      })
      .catch(() => navigate("/mock-assessments"))
      .finally(() => setLoading(false));
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!started || view !== "exam") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, view]);

  const allQuestions = sections ? SECTION_ORDER.flatMap((s) => sections[s] || []) : [];
  const answeredCount = Object.keys(answers).length;

  const handleSubmit = useCallback(async (auto = false) => {
    if (!id || !sections) return;
    if (!auto && !confirm("Submit the exam? You cannot change your answers after submission.")) return;
    setShowConfirm(false);
    setSubmitting(true);

    const payload = allQuestions.map((q) => ({
      questionId: q._id,
      selected: answers[q._id] ?? -1,
    }));

    const timeTaken = (exam?.duration || 60) * 60 - timeLeft;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/mock/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: payload, timeTaken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
      setView("result");
    } catch (err: any) {
      alert(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }, [id, sections, answers, timeLeft, exam]);

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

  if (view === "result" && result && exam) {
    return <ResultView result={result} exam={exam} onReview={() => setView("review")} />;
  }

  if (view === "review" && result) {
    return <ReviewView result={result} onBack={() => setView("result")} />;
  }

  if (!exam || !sections) return null;

  // ── Instructions screen ──────────────────────────────────────────────────
  if (!started) {
    const lines = exam.instructions?.split("\n").filter(Boolean) || [];
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className={`h-3 rounded-t-2xl bg-gradient-to-r ${exam.banner}`} />
          <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-100 p-8">
            <h1 className="text-2xl font-black text-slate-900 mb-1">{exam.title}</h1>
            {exam.description && <p className="text-slate-500 text-sm mb-6">{exam.description}</p>}

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Duration", val: `${exam.duration} min`, icon: <Clock className="w-4 h-4" /> },
                { label: "Questions", val: allQuestions.length, icon: <BookOpen className="w-4 h-4" /> },
                { label: "Passing", val: `${exam.passingScore}%`, icon: <Trophy className="w-4 h-4" /> },
              ].map(({ label, val, icon }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="flex justify-center text-primary mb-1">{icon}</div>
                  <p className="text-lg font-black text-slate-900">{val}</p>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {SECTION_ORDER.map((s) => {
                const m = SECTION_META[s];
                const count = sections[s]?.length || 0;
                return (
                  <div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${m.bg}`}>
                    <span className={`text-sm font-bold ${m.color}`}>{m.label}</span>
                    <span className="ml-auto text-xs font-bold text-slate-500">{count} Qs</span>
                  </div>
                );
              })}
            </div>

            {lines.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-amber-800 mb-2">Instructions</p>
                <ul className="space-y-1">
                  {lines.map((l, i) => <li key={i} className="text-sm text-amber-700">{l}</li>)}
                </ul>
              </div>
            )}

            <button
              onClick={() => setStarted(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition-all"
            >
              <Send className="w-4 h-4" /> Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam screen ──────────────────────────────────────────────────────────
  const currentQuestions = sections[activeSection as keyof Sections] || [];
  const urgent = timeLeft < 5 * 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/mock-assessments" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-black text-slate-900 text-sm sm:text-base truncate max-w-[200px]">{exam.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-500">
              {answeredCount}/{allQuestions.length} answered
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border ${urgent ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-slate-700 bg-slate-50 border-slate-200"}`}>
              <Clock className="w-3.5 h-3.5" />
              {fmt(timeLeft)}
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold shadow transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit
            </button>
          </div>
        </div>
        {/* Section tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-0 border-t border-slate-100 overflow-x-auto">
          {SECTION_ORDER.map((s) => {
            const m = SECTION_META[s];
            const qs = sections[s] || [];
            const done = qs.filter((q) => answers[q._id] !== undefined).length;
            return (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeSection === s ? `border-primary ${m.color}` : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {m.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${activeSection === s ? `${m.bg} border` : "bg-slate-100 text-slate-500"}`}>
                  {done}/{qs.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex gap-5">
        <div className="flex-1 space-y-5">
          {currentQuestions.map((q, i) => {
            const selected = answers[q._id];
            return (
              <div key={q._id} id={`q-${q._id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm font-black shrink-0 ${selected !== undefined ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">{q.question}</p>
                </div>
                <div className="space-y-2 ml-10">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers((p) => ({ ...p, [q._id]: oi }))}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${selected === oi ? "border-primary bg-primary/5 text-primary font-semibold" : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${selected === oi ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-400"}`}>
                        {selected === oi ? "✓" : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Question palette sidebar */}
        <div className="hidden lg:block w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sticky top-28">
            <p className="text-xs font-bold text-slate-500 mb-3">Question Palette</p>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {currentQuestions.map((q, i) => {
                const done = answers[q._id] !== undefined;
                return (
                  <button
                    key={q._id}
                    onClick={() => document.getElementById(`q-${q._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${done ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 rounded bg-primary" />
                Answered ({currentQuestions.filter((q) => answers[q._id] !== undefined).length})
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
                Not answered ({currentQuestions.filter((q) => answers[q._id] === undefined).length})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900 text-center mb-2">Submit Exam?</h3>
            <p className="text-sm text-slate-500 text-center mb-1">
              You have answered <strong>{answeredCount}</strong> of <strong>{allQuestions.length}</strong> questions.
            </p>
            {allQuestions.length - answeredCount > 0 && (
              <p className="text-sm text-orange-600 font-semibold text-center mb-4">
                {allQuestions.length - answeredCount} question(s) unanswered.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Continue
              </button>
              <button onClick={() => handleSubmit()} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
