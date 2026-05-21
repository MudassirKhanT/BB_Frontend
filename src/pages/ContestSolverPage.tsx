import { useState, useEffect, useRef, type ReactElement } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { contestApi, compileApi } from "@/lib/api";
import { ArrowLeft, Play, CheckCircle2, XCircle, Clock, Loader2, RotateCcw, Copy, Check, Terminal, BookOpen, Trophy, ChevronDown, ChevronUp, Code2, AlertCircle, Send, Undo2, Redo2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ContestProblem {
  problem: {
    _id: string;
    title: string;
    slug: string;
    difficulty: string;
    topicTag: string;
    description: string;
    examples: { input: string; output: string; explanation: string }[];
    testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
    starterCode: { python: string; javascript: string; cpp: string; java: string };
  };
  points: number;
  order: number;
}

interface Contest {
  _id: string;
  title: string;
  slug: string;
  status: "upcoming" | "ongoing" | "ended";
  startTime: string;
  endTime: string;
  isRegistered: boolean;
  problems: ContestProblem[];
}

interface SubmitResult {
  status: string;
  score: number;
  attemptNumber: number;
  testResults: { input: string; expectedOutput: string; actualOutput: string; passed: boolean; stderr: string }[];
  submissionId: string;
}

const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
] as const;
type LangId = (typeof LANGUAGES)[number]["id"];

const CODE_SUGGESTIONS: Record<LangId, string[]> = {
  python: ["def solve():", "for i in range(n):", "if x == y:", "return result", "print(result)"],
  javascript: ["function solve() {", "for (let i = 0; i < n; i++) {", "if (x === y) {", "return result;", "console.log(result);"],
  cpp: ["#include <bits/stdc++.h>", "int main() {", "for (int i = 0; i < n; i++) {", "if (x == y) {", "return 0;"],
  java: ["public class Solution {", "public static void main(String[] args) {", "for (int i = 0; i < n; i++) {", "if (x == y) {", "return;"],
};

const DIFF_CLS: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_CFG: Record<string, { label: string; icon: ReactElement; cls: string }> = {
  accepted: { label: "Accepted", icon: <CheckCircle2 className="w-4 h-4" />, cls: "text-green-400 bg-green-900/30 border-green-700" },
  wrong_answer: { label: "Wrong Answer", icon: <XCircle className="w-4 h-4" />, cls: "text-red-400 bg-red-900/30 border-red-700" },
  runtime_error: { label: "Runtime Error", icon: <AlertCircle className="w-4 h-4" />, cls: "text-orange-400 bg-orange-900/30 border-orange-700" },
  compile_error: { label: "Compile Error", icon: <AlertCircle className="w-4 h-4" />, cls: "text-yellow-400 bg-yellow-900/30 border-yellow-700" },
};

function renderDesc(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="px-1.5 py-0.5 bg-slate-200 text-blue-700 rounded text-[0.85em] font-mono">
          {p.slice(1, -1)}
        </code>
      );
    return p.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

function ContestTimer({ endTime, status }: { endTime: string; status: string }) {
  const [rem, setRem] = useState("");
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    if (status !== "ongoing") return;
    const tick = () => {
      const d = new Date(endTime).getTime() - Date.now();
      if (d <= 0) {
        setRem("Ended");
        return;
      }
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setUrgent(d < 5 * 60 * 1000);
      setRem(`${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime, status]);
  if (!rem) return null;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${urgent ? "text-red-400 bg-red-900/30 border-red-700 animate-pulse" : "text-slate-300 bg-slate-700 border-slate-600"}`}>
      <Clock className="w-3.5 h-3.5" />
      {rem}
    </div>
  );
}

export default function ContestSolverPage() {
  const { slug, problemSlug } = useParams<{ slug: string; problemSlug: string }>();
  const navigate = useNavigate();

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"description" | "testcases">("description");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const [language, setLanguage] = useState<LangId>("python");
  const [code, setCode] = useState<Record<LangId, string>>({
    python: "# Write your solution here\n",
    javascript: "// Write your solution here\n",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
    java: "public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
  });

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runOutput, setRunOutput] = useState<{ stdout: string; stderr: string; exitCode: number } | null>(null);
  const [outputTab, setOutputTab] = useState<"output" | "submit" | "input">("output");
  const [customInput, setCustomInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [outputHeight, setOutputHeight] = useState(36);
  const [completionOptions, setCompletionOptions] = useState<string[]>([]);
  const [completionPrefix, setCompletionPrefix] = useState("");
  const [activeCompletionIndex, setActiveCompletionIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef   = useRef<HTMLDivElement>(null);

  const handleUndo = () => { textareaRef.current?.focus(); document.execCommand("undo"); };
  const handleRedo = () => { textareaRef.current?.focus(); document.execCommand("redo"); };

  // Drag-to-resize output panel
  const dragRef = useRef<{ active: boolean; startY: number; startH: number }>({ active: false, startY: 0, startH: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const delta = dragRef.current.startY - e.clientY;
      setOutputHeight(Math.max(36, Math.min(520, dragRef.current.startH + delta)));
    };
    const onUp = () => { dragRef.current.active = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);
  const startOutputDrag = (e: React.MouseEvent) => {
    dragRef.current = { active: true, startY: e.clientY, startH: outputHeight };
    e.preventDefault();
  };
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!slug) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    contestApi
      .getBySlug(slug)
      .then((data) => {
        setContest(data);
        // Init starter code from current problem
        const cp = (data.problems as ContestProblem[]).find((p) => p.problem.slug === problemSlug);
        if (cp?.problem?.starterCode) {
          setCode({
            python: cp.problem.starterCode.python || "# Write your solution here\n",
            javascript: cp.problem.starterCode.javascript || "// Write your solution here\n",
            cpp: cp.problem.starterCode.cpp || "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
            java: cp.problem.starterCode.java || "public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
          });
        }
      })
      .catch(() => navigate(`/contests/${slug}`))
      .finally(() => setLoading(false));
  }, [slug, problemSlug]);

  // Reset code/results when switching problems
  useEffect(() => {
    if (!contest) return;
    const cp = contest.problems.find((p) => p.problem.slug === problemSlug);
    if (cp?.problem?.starterCode) {
      setCode({
        python: cp.problem.starterCode.python || "# Write your solution here\n",
        javascript: cp.problem.starterCode.javascript || "// Write your solution here\n",
        cpp: cp.problem.starterCode.cpp || "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
        java: cp.problem.starterCode.java || "public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
      });
    }
    setRunOutput(null);
    setSubmitResult(null);
    setOutputTab("output");
  }, [problemSlug]);

  useEffect(() => { if (runOutput !== null) setOutputHeight((h) => h < 200 ? 260 : h); }, [runOutput]);
  useEffect(() => { if (submitResult !== null) setOutputHeight((h) => h < 200 ? 260 : h); }, [submitResult]);

  const getCompletionPrefix = (value: string, cursor: number) => {
    const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
    const segment = value.slice(lineStart, cursor);
    const match = segment.match(/[\w$]+$/);
    return match?.[0] || "";
  };

  const updateCompletions = (value: string, cursor: number) => {
    const prefix = getCompletionPrefix(value, cursor);
    const options = prefix ? CODE_SUGGESTIONS[language].filter((item) => item.startsWith(prefix) && item !== prefix) : [];
    setCompletionPrefix(prefix);
    setCompletionOptions(options);
    setActiveCompletionIndex(0);
  };

  const insertCompletion = (completion: string, cursor: number) => {
    const current = code[language];
    const start = cursor - completionPrefix.length;
    const before = current.slice(0, start);
    const after = current.slice(cursor);
    const next = before + completion + after;
    setCode((p) => ({ ...p, [language]: next }));
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = start + completion.length;
      el.selectionStart = el.selectionEnd = pos;
      updateCompletions(next, pos);
      el.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (e.key === "Tab") {
      if (completionOptions.length > 0) {
        e.preventDefault();
        insertCompletion(completionOptions[activeCompletionIndex], start);
        return;
      }
      e.preventDefault();
      const newVal = el.value.slice(0, start) + "    " + el.value.slice(end);
      setCode((p) => ({ ...p, [language]: newVal }));
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
      return;
    }

    if (e.key === "ArrowDown" && completionOptions.length > 0) {
      e.preventDefault();
      setActiveCompletionIndex((idx) => (idx + 1) % completionOptions.length);
      return;
    }

    if (e.key === "ArrowUp" && completionOptions.length > 0) {
      e.preventDefault();
      setActiveCompletionIndex((idx) => (idx - 1 + completionOptions.length) % completionOptions.length);
      return;
    }

    if (e.key === "Escape") {
      setCompletionOptions([]);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const lineStart = before.lastIndexOf("\n") + 1;
      const indent = before.slice(lineStart).match(/^\s*/)?.[0] || "";
      const newVal = before + "\n" + indent + after;
      setCode((p) => ({ ...p, [language]: newVal }));
      requestAnimationFrame(() => {
        const pos = start + 1 + indent.length;
        el.selectionStart = el.selectionEnd = pos;
        updateCompletions(newVal, pos);
      });
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunOutput(null);
    setOutputTab("output");
    try {
      const res = await compileApi.run({ language, code: code[language], stdin: customInput });
      setRunOutput(res as unknown as { stdout: string; stderr: string; exitCode: number });
    } catch (err: unknown) {
      setRunOutput({ stdout: "", stderr: err instanceof Error ? err.message : "Failed to run", exitCode: 1 });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!slug || !problemSlug) return;
    setSubmitting(true);
    setSubmitResult(null);
    setOutputTab("submit");
    try {
      const res = await contestApi.submit(slug, problemSlug, { code: code[language], language });
      setSubmitResult(res as unknown as SubmitResult);
    } catch (err: unknown) {
      setSubmitResult(null);
      // Show error in the submit panel
      setRunOutput({ stdout: "", stderr: err instanceof Error ? err.message : "Submission failed", exitCode: 1 });
      setOutputTab("output");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code[language]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) return null;

  const sortedProblems = [...contest.problems].sort((a, b) => a.order - b.order);
  const currentCp = sortedProblems.find((cp) => cp.problem.slug === problemSlug);
  const problem = currentCp?.problem;
  const currentIdx = sortedProblems.findIndex((cp) => cp.problem.slug === problemSlug);

  if (!problem) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 text-lg font-semibold mb-4">Problem not found in this contest</p>
          <button onClick={() => navigate(`/contests/${slug}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
            Back to Contest
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = contest.status === "ongoing" && (contest.isRegistered || JSON.parse(localStorage.getItem("user") || "{}").role === "admin");
  const visibleTestCases = problem.testCases?.filter((t) => !t.isHidden) || [];

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(`/contests/${slug}`)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Contest</span>
          </button>
          <div className="h-4 w-px bg-slate-600 shrink-0" />
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">B</span>
            </div>
          </Link>
          <div className="h-4 w-px bg-slate-600 shrink-0" />
          <span className="text-slate-300 font-bold text-sm truncate hidden md:block max-w-[160px]">{contest.title}</span>
        </div>

        {/* Problem letter tabs */}
        <div className="flex items-center gap-1 flex-1 justify-center max-w-xs">
          {sortedProblems.map((cp, i) => {
            const letter = String.fromCharCode(65 + i);
            const isCurrent = cp.problem.slug === problemSlug;
            return (
              <Link key={cp.problem._id} to={`/contests/${slug}/solve/${cp.problem.slug}`} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-all ${isCurrent ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`} title={cp.problem.title}>
                {letter}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ContestTimer endTime={contest.endTime} status={contest.status} />
          <button onClick={handleRun} disabled={running || submitting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">Test</span>
          </button>
          {canSubmit ? (
            <button onClick={handleSubmit} disabled={running || submitting} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold shadow-lg transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400 text-xs font-semibold">{contest.status === "upcoming" ? "Not started" : contest.status === "ended" ? "Ended" : "Register first"}</div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* ── LEFT: Problem ── */}
        <div className="w-full h-[45%] md:h-full md:w-[45%] md:min-w-[320px] bg-slate-50 flex flex-col border-b md:border-b-0 md:border-r border-slate-700 overflow-hidden">
          {/* Points badge */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900">{String.fromCharCode(65 + currentIdx)}.</span>
              <h1 className="text-base font-black text-slate-900 leading-tight">{problem.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {problem.difficulty && <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${DIFF_CLS[problem.difficulty] || ""}`}>{problem.difficulty}</span>}
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Trophy className="w-3 h-3" />
                {currentCp!.points} pts
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-slate-200 bg-white mt-2 shrink-0">
            <button onClick={() => setActiveTab("description")} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "description" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <BookOpen className="w-3.5 h-3.5" />
              Description
            </button>
            <button onClick={() => setActiveTab("testcases")} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "testcases" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <Code2 className="w-3.5 h-3.5" />
              Examples
              {visibleTestCases.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{visibleTestCases.length}</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "description" ? (
              <div className="p-5">
                <div className="text-sm text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{renderDesc(problem.description || "")}</div>
                {(problem.examples || []).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Examples</h3>
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-500">Example {i + 1}</span>
                        </div>
                        <div className="p-4 space-y-2 bg-white">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Input</span>
                            <pre className="mt-1 text-sm font-mono bg-slate-50 rounded-lg p-3 text-slate-800 whitespace-pre-wrap border border-slate-100">{ex.input}</pre>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Output</span>
                            <pre className="mt-1 text-sm font-mono bg-slate-50 rounded-lg p-3 text-slate-800 whitespace-pre-wrap border border-slate-100">{ex.output}</pre>
                          </div>
                          {ex.explanation && (
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase">Explanation</span>
                              <p className="mt-1 text-sm text-slate-600">{ex.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5">
                {visibleTestCases.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No visible test cases</p>
                ) : (
                  <div className="space-y-3">
                    {visibleTestCases.map((tc, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500">Case {i + 1}</span>
                          <button
                            onClick={() => {
                              setCustomInput(tc.input);
                              setOutputTab("input");
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            Use as input
                          </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Input</p>
                            <pre className="text-xs font-mono bg-slate-50 rounded-lg p-2.5 text-slate-700 whitespace-pre-wrap border border-slate-100 min-h-[2.5rem]">{tc.input}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Expected</p>
                            <pre className="text-xs font-mono bg-green-50 rounded-lg p-2.5 text-green-800 whitespace-pre-wrap border border-green-100 min-h-[2.5rem]">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor ── */}
        <div className="w-full h-[55%] md:h-full md:flex-1 flex flex-col overflow-hidden bg-slate-100">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-200 border-b border-slate-300 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5">
              {LANGUAGES.map((lang) => (
                <button key={lang.id} onClick={() => setLanguage(lang.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${language === lang.id ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`}>
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleUndo} title="Undo (Ctrl+Z)" className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <Undo2 className="w-3 h-3" />
              </button>
              <button onClick={handleRedo} title="Redo (Ctrl+Y)" className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <Redo2 className="w-3 h-3" />
              </button>
              <div className="w-px h-4 bg-slate-600" />
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => {
                  if (!problem) return;
                  setCode((p) => ({ ...p, [language]: problem.starterCode?.[language as keyof typeof problem.starterCode] || "" }));
                  setRunOutput(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Code editor */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Line number gutter */}
            <div
              ref={gutterRef}
              className="shrink-0 w-11 bg-slate-200 text-slate-400 font-mono text-sm leading-6 text-right select-none overflow-hidden pt-4 pr-2 border-r border-slate-300"
              style={{ fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace" }}
            >
              {code[language].split("\n").map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code[language]}
              onChange={(e) => {
                const value = e.target.value;
                const cursor = e.target.selectionStart;
                setCode((p) => ({ ...p, [language]: value }));
                updateCompletions(value, cursor);
              }}
              onSelect={() => {
                const el = textareaRef.current;
                if (!el) return;
                updateCompletions(code[language], el.selectionStart);
              }}
              onKeyDown={handleKeyDown}
              onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
              spellCheck={false}
              className="flex-1 min-w-0 bg-white text-slate-900 font-mono text-sm p-4 pl-3 resize-none outline-none leading-6 selection:bg-blue-200 overflow-y-auto"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", tabSize: 4 }}
            />
          </div>
            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Completions</p>
              <div className="flex flex-wrap gap-2">
                {completionOptions.length > 0 ? (
                  completionOptions.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const el = textareaRef.current;
                        if (!el) return;
                        insertCompletion(option, el.selectionStart);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition ${index === activeCompletionIndex ? "border-blue-500 bg-blue-100 text-blue-700" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"}`}
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Type an identifier to see completions. Use Tab to accept.</span>
                )}
              </div>
            </div>

            {/* Output / Submit Results Panel */}
            <div
              className="shrink-0 flex flex-col border-t border-slate-300 bg-slate-100 overflow-hidden"
              style={{ height: `${outputHeight}px` }}
            >
              {/* Drag Handle */}
              <div
                onMouseDown={startOutputDrag}
                className="h-1.5 bg-slate-200 hover:bg-blue-400 cursor-ns-resize flex items-center justify-center group shrink-0 transition-colors"
                title="Drag to resize output panel"
              >
                <div className="w-8 h-0.5 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 px-4 h-9 shrink-0">
                <div className="flex items-center">
                  {[
                    { key: "output" as const, label: "Output", icon: <Terminal className="w-3 h-3" /> },
                    { key: "submit" as const, label: "Result", icon: <Send className="w-3 h-3" /> },
                    { key: "input" as const, label: "Custom Input", icon: <Code2 className="w-3 h-3" /> },
                  ].map(({ key, label, icon }) => (
                    <button key={key} onClick={() => { setOutputTab(key); setOutputHeight((h) => h < 200 ? 260 : h); }} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${outputTab === key ? "border-blue-500 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                      {icon}
                      {label}
                      {key === "submit" && submitResult && <span className={`w-2 h-2 rounded-full ml-1 ${submitResult.status === "accepted" ? "bg-green-500" : "bg-red-500"}`} />}
                      {key === "output" && runOutput && <span className={`w-2 h-2 rounded-full ml-1 ${runOutput.exitCode === 0 ? "bg-green-500" : "bg-red-500"}`} />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setOutputHeight((h) => h <= 36 ? 260 : 36)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-700 transition-colors"
                  title={outputHeight > 36 ? "Collapse output" : "Expand output"}
                >
                  {outputHeight > 36 ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {/* Run Output */}
                {outputTab === "output" && (
                  <div className="p-4">
                    {running ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-sm">Running...</span>
                      </div>
                    ) : !runOutput ? (
                      <p className="text-slate-500 text-sm">
                        Click <span className="text-blue-400 font-semibold">Test</span> to run against custom input.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {runOutput.stdout && <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap leading-5">{runOutput.stdout}</pre>}
                        {runOutput.stderr && <pre className="text-sm font-mono text-red-400 whitespace-pre-wrap leading-5">{runOutput.stderr}</pre>}
                        {!runOutput.stdout && !runOutput.stderr && <p className="text-slate-400 text-sm italic">No output</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Results */}
                {outputTab === "submit" && (
                  <div className="p-4">
                    {submitting ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                        <span className="text-sm">Judging your submission...</span>
                      </div>
                    ) : !submitResult ? (
                      <p className="text-slate-500 text-sm">
                        Click <span className="text-green-400 font-semibold">Submit</span> to judge against all test cases.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {/* Verdict banner */}
                        {(() => {
                          const sc = STATUS_CFG[submitResult.status] || { label: submitResult.status, icon: null, cls: "text-slate-400 bg-slate-800 border-slate-600" };
                          return (
                            <div className={`flex items-center justify-between px-4 py-2 rounded-xl border font-bold text-sm ${sc.cls}`}>
                              <div className="flex items-center gap-2">
                                {sc.icon}
                                <span>{sc.label}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {submitResult.score > 0 && (
                                  <span className="flex items-center gap-1 text-yellow-400 font-black">
                                    <Trophy className="w-3.5 h-3.5" />+{submitResult.score} pts
                                  </span>
                                )}
                                <span className="text-slate-400">Attempt #{submitResult.attemptNumber}</span>
                              </div>
                            </div>
                          );
                        })()}
                        {/* Test results breakdown */}
                        <div className="grid grid-cols-5 gap-1.5">
                          {submitResult.testResults.map((tr, i) => (
                            <div key={i} className={`flex items-center justify-center p-2 rounded-lg text-xs font-bold border ${tr.passed ? "bg-green-900/30 border-green-700 text-green-400" : "bg-red-900/30 border-red-700 text-red-400"}`} title={tr.passed ? "Passed" : `Failed\nExpected: ${tr.expectedOutput}\nGot: ${tr.actualOutput}${tr.stderr ? "\n" + tr.stderr : ""}`}>
                              {tr.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              <span className="ml-1">#{i + 1}</span>
                            </div>
                          ))}
                        </div>
                        {/* First failing case detail */}
                        {submitResult.testResults.find((t) => !t.passed) &&
                          (() => {
                            const fail = submitResult.testResults.find((t) => !t.passed)!;
                            return (
                              <div className="space-y-1.5 text-xs font-mono">
                                {fail.input && (
                                  <div>
                                    <span className="text-slate-500">Input: </span>
                                    <span className="text-slate-300">{fail.input}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-500">Expected: </span>
                                  <span className="text-green-400">{fail.expectedOutput}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Got: </span>
                                  <span className="text-red-400">{fail.actualOutput || fail.stderr || "(no output)"}</span>
                                </div>
                              </div>
                            );
                          })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Input */}
                {outputTab === "input" && (
                  <div className="p-4">
                    <p className="text-xs text-slate-400 mb-2">Enter stdin for Test run:</p>
                    <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter custom input here..." className="w-full h-24 bg-slate-900 text-slate-200 font-mono text-xs p-3 rounded-lg border border-slate-700 resize-none outline-none focus:border-blue-500 placeholder-slate-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
