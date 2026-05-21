import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, BookOpen, Code2, MessageSquare, Layers, Globe, Calculator, ChevronRight, ExternalLink, Send, CheckCircle2, ThumbsUp, Calendar, User, AlertCircle, Star, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Shield, Eye, EyeOff } from "lucide-react";
import { companyApi, interviewExpApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrepItem {
  _id: string;
  category: string;
  title: string;
  content: string;
  resources: { title: string; url: string; type: string }[];
}

interface PrepQuestion {
  _id: string;
  category: string;
  type: "mcq" | "coding" | "theory";
  question: string;
  options: string[];
  answer: string;
  solution: string;
  solutionCode: string;
  solutionLanguage: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  order: number;
  isPublished?: boolean;
}

interface PrepData {
  aptitude?: PrepItem[];
  communication?: PrepItem[];
  dsa?: PrepItem[];
  lld?: PrepItem[];
  hld?: PrepItem[];
}

interface QuestionData {
  aptitude?: PrepQuestion[];
  communication?: PrepQuestion[];
  dsa?: PrepQuestion[];
  lld?: PrepQuestion[];
  hld?: PrepQuestion[];
}

interface Company {
  _id: string;
  name: string;
  slug: string;
  color: string;
  type: string;
}

interface Experience {
  _id: string;
  authorName: string;
  role: string;
  year: number;
  experience: string;
  result: "selected" | "rejected" | "pending";
  rounds: string[];
  tips: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "aptitude", label: "Aptitude", icon: Calculator },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "dsa", label: "DSA & Coding", icon: Code2 },
  { key: "lld", label: "LLD", icon: Layers },
  { key: "hld", label: "HLD", icon: Globe },
  { key: "experiences", label: "Interview Exp.", icon: Star },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DIFFICULTY_STYLES = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};

const RESULT_STYLES: Record<string, string> = {
  selected: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-slate-50 text-slate-600 border-slate-200",
};

const RESOURCE_ICONS: Record<string, string> = {
  article: "📄",
  video: "🎬",
  pdf: "📕",
  practice: "⚡",
  book: "📚",
};

const TYPE_LABELS = { mcq: "MCQ", coding: "Coding", theory: "Theory" };
const TYPE_COLORS = {
  mcq: "bg-blue-50 text-blue-700 border-blue-200",
  coding: "bg-violet-50 text-violet-700 border-violet-200",
  theory: "bg-slate-50 text-slate-600 border-slate-200",
};

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let codeBlock: string[] = [];
  let inCode = false;
  let codeKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre key={`code-${codeKey++}`} className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono my-3 leading-relaxed">
            <code>{codeBlock.join("\n")}</code>
          </pre>,
        );
        codeBlock = [];
        inCode = false;
      } else {
        inCode = true;
      }
      i++;
      continue;
    }
    if (inCode) {
      codeBlock.push(line);
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-black text-slate-900 mt-7 mb-2 first:mt-0 border-b border-slate-100 pb-2">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-800 mt-5 mb-2">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("| ")) {
      const tableRows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith("|")) {
        const cells = lines[j]
          .split("|")
          .filter((c) => c.trim() !== "")
          .map((c) => c.trim());
        if (!cells.every((c) => /^[-:]+$/.test(c))) tableRows.push(cells);
        j++;
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-4 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {tableRows[0]?.map((cell, ci) => (
                  <th key={ci} className="px-4 py-2.5 text-left font-bold text-slate-700 text-xs border-b border-slate-200">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-slate-600 text-xs border-b border-slate-100 last:border-0">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      i = j;
      continue;
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 mb-1.5">
          <CheckCircle2 size={13} className="text-primary flex-shrink-0 mt-0.5" />
          <span
            dangerouslySetInnerHTML={{
              __html: line
                .slice(2)
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/`(.*?)`/g, '<code class="bg-slate-100 rounded px-1 font-mono text-xs">$1</code>'),
            }}
          />
        </div>,
      );
    } else if (line === "---") {
      elements.push(<hr key={i} className="my-5 border-slate-100" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/`(.*?)`/g, '<code class="bg-slate-100 rounded px-1 font-mono text-xs">$1</code>');
      elements.push(<p key={i} className="text-sm text-slate-600 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: html }} />);
    }
    i++;
  }
  return <>{elements}</>;
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ q, index, isAdmin, onEdit, onDelete }: { q: PrepQuestion; index: number; isAdmin: boolean; onEdit: (q: PrepQuestion) => void; onDelete: (id: string) => void }) {
  const [showSolution, setShowSolution] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Question header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0 mt-0.5">{index + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${DIFFICULTY_STYLES[q.difficulty]}`}>{q.difficulty}</span>
            <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${TYPE_COLORS[q.type]}`}>{TYPE_LABELS[q.type]}</span>
            {q.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
                {tag}
              </span>
            ))}
            {isAdmin && (
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => onEdit(q)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(q._id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.question}</p>
        </div>
      </div>

      {/* MCQ Options */}
      {q.type === "mcq" && q.options.length > 0 && (
        <div className="px-5 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt, oi) => {
            const letter = String.fromCharCode(65 + oi);
            const isSelected = selectedOption === opt;
            const isCorrect = revealed && opt === q.answer;
            const isWrong = revealed && isSelected && opt !== q.answer;
            return (
              <button
                key={oi}
                onClick={() => {
                  setSelectedOption(opt);
                  if (!revealed) setRevealed(false);
                }}
                className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold" : isWrong ? "bg-rose-50 border-rose-300 text-rose-700" : isSelected ? "bg-primary/5 border-primary text-primary font-medium" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${isCorrect ? "bg-emerald-200 text-emerald-800" : isWrong ? "bg-rose-200 text-rose-700" : isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>{letter}</span>
                {opt}
              </button>
            );
          })}
          {selectedOption && !revealed && (
            <button onClick={() => setRevealed(true)} className="col-span-full mt-1 text-xs font-bold text-primary hover:underline text-left flex items-center gap-1">
              <Eye size={12} /> Check Answer
            </button>
          )}
        </div>
      )}

      {/* Solution toggle */}
      <div className="px-5 pb-4">
        <button onClick={() => setShowSolution(!showSolution)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors mt-1">
          {showSolution ? <EyeOff size={13} /> : <Eye size={13} />}
          {showSolution ? "Hide Solution" : "View Solution"}
          {showSolution ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showSolution && (
          <div className="mt-3 space-y-3">
            {/* Answer highlight for MCQ/theory */}
            {q.answer && q.type !== "coding" && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-0.5">Correct Answer</div>
                  <div className="text-sm font-semibold text-emerald-900">{q.answer}</div>
                </div>
              </div>
            )}

            {/* Solution explanation */}
            {q.solution && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Explanation</div>
                <MarkdownContent text={q.solution} />
              </div>
            )}

            {/* Solution code */}
            {q.solutionCode && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Solution Code</div>
                  {q.solutionLanguage && <span className="text-[10px] font-bold bg-slate-800 text-slate-300 rounded px-2 py-0.5">{q.solutionLanguage}</span>}
                </div>
                <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                  <code>{q.solutionCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Question Form (Add / Edit) ────────────────────────────────────────

const BLANK_FORM = {
  type: "theory" as "mcq" | "coding" | "theory",
  question: "",
  options: ["", "", "", ""],
  answer: "",
  solution: "",
  solutionCode: "",
  solutionLanguage: "" as string,
  difficulty: "Easy" as "Easy" | "Medium" | "Hard",
  tags: "",
  order: 0,
  isPublished: true,
};

function AdminQuestionForm({ category, companyId, editTarget, onSaved, onCancel }: { category: string; companyId: string; editTarget: PrepQuestion | null; onSaved: (q: PrepQuestion) => void; onCancel: () => void }) {
  const [form, setForm] = useState(() => {
    if (editTarget) {
      return {
        type: editTarget.type,
        question: editTarget.question,
        options: editTarget.options.length === 4 ? editTarget.options : ["", "", "", ""],
        answer: editTarget.answer,
        solution: editTarget.solution,
        solutionCode: editTarget.solutionCode,
        solutionLanguage: editTarget.solutionLanguage,
        difficulty: editTarget.difficulty,
        tags: editTarget.tags.join(", "),
        order: editTarget.order,
        isPublished: editTarget.isPublished ?? true,
      };
    }
    return { ...BLANK_FORM };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, val: unknown) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) {
      setError("Question text is required.");
      return;
    }
    if (form.type === "mcq" && form.options.some((o) => !o.trim())) {
      setError("All 4 MCQ options are required.");
      return;
    }
    if (form.type === "mcq" && !form.answer.trim()) {
      setError("Correct answer is required for MCQ.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        category,
        options: form.type === "mcq" ? form.options.map((o) => o.trim()) : [],
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      let saved: PrepQuestion;
      if (editTarget) {
        saved = await companyApi.updateQuestion(editTarget._id, payload);
      } else {
        saved = await companyApi.createQuestion(companyId, payload);
      }
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1.5";

  return (
    <div className="bg-white rounded-2xl border-2 border-primary/20 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
          <Shield size={14} className="text-primary" />
          {editTarget ? "Edit Question" : "Add New Question"}
          <span className="text-[10px] font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5 uppercase">{category}</span>
        </h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: type / difficulty / order */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Question Type</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
              <option value="theory">Theory</option>
              <option value="mcq">MCQ</option>
              <option value="coding">Coding</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Difficulty</label>
            <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={inputCls}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Order</label>
            <input type="number" min={0} value={form.order} onChange={(e) => set("order", Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        {/* Question text */}
        <div>
          <label className={labelCls}>Question *</label>
          <textarea rows={3} placeholder="Write the question..." value={form.question} onChange={(e) => set("question", e.target.value)} className={`${inputCls} resize-none`} required />
        </div>

        {/* MCQ Options */}
        {form.type === "mcq" && (
          <div>
            <label className={labelCls}>MCQ Options (A, B, C, D)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {form.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-black flex items-center justify-center flex-shrink-0">{String.fromCharCode(65 + oi)}</span>
                  <input
                    type="text"
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={(e) => {
                      const ops = [...form.options];
                      ops[oi] = e.target.value;
                      set("options", ops);
                    }}
                    className={inputCls}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer */}
        {(form.type === "mcq" || form.type === "theory") && (
          <div>
            <label className={labelCls}>{form.type === "mcq" ? "Correct Answer (paste exact option text)" : "Short Answer / Key Points"}</label>
            <input type="text" placeholder={form.type === "mcq" ? "e.g. O(n log n)" : "e.g. Polymorphism allows..."} value={form.answer} onChange={(e) => set("answer", e.target.value)} className={inputCls} />
          </div>
        )}

        {/* Solution explanation */}
        <div>
          <label className={labelCls}>Solution / Explanation (Markdown supported)</label>
          <textarea rows={5} placeholder="Full explanation, approach, key points..." value={form.solution} onChange={(e) => set("solution", e.target.value)} className={`${inputCls} resize-none font-mono text-xs`} />
        </div>

        {/* Solution code (coding type) */}
        {(form.type === "coding" || form.solutionCode) && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className={labelCls}>Solution Code</label>
              <textarea rows={6} placeholder="def solution(arr):\n    pass" value={form.solutionCode} onChange={(e) => set("solutionCode", e.target.value)} className={`${inputCls} resize-none font-mono text-xs`} />
            </div>
            <div>
              <label className={labelCls}>Language</label>
              <select value={form.solutionLanguage} onChange={(e) => set("solutionLanguage", e.target.value)} className={inputCls}>
                <option value="">None</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
              </select>
            </div>
          </div>
        )}

        {form.type !== "coding" && (
          <button type="button" onClick={() => set("solutionCode", form.solutionCode ? "" : " ")} className="text-xs font-semibold text-primary hover:underline">
            {form.solutionCode ? "− Remove code block" : "+ Add code block"}
          </button>
        )}

        {/* Tags + published */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input type="text" placeholder="e.g. arrays, sorting, binary search" value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => set("isPublished", !form.isPublished)} className={`w-10 h-5 rounded-full transition-colors relative ${form.isPublished ? "bg-primary" : "bg-slate-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs font-bold text-slate-700">Published</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20">
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> {editTarget ? "Save Changes" : "Add Question"}
              </>
            )}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Experience Card ──────────────────────────────────────────────────────────

function ExperienceCard({ exp }: { exp: Experience }) {
  const [expanded, setExpanded] = useState(false);
  const preview = exp.experience.slice(0, 280);
  const hasMore = exp.experience.length > 280;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary">{exp.authorName.charAt(0).toUpperCase()}</div>
            <span className="font-bold text-slate-900 text-sm">{exp.authorName}</span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-medium">{exp.role}</span>
          </div>
          <div className="flex items-center gap-2 pl-10 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Calendar size={11} /> {exp.year}
            </span>
            {exp.rounds.length > 0 && <span className="text-xs text-slate-400">• {exp.rounds.length} rounds</span>}
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest border rounded-full px-2.5 py-1 flex-shrink-0 ${RESULT_STYLES[exp.result]}`}>{exp.result}</span>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {expanded ? exp.experience : preview}
        {!expanded && hasMore && "..."}
      </div>
      {hasMore && (
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs font-bold text-primary hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      {exp.rounds.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {exp.rounds.map((r, i) => (
            <span key={i} className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
              {r}
            </span>
          ))}
        </div>
      )}
      {exp.tips && (
        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <div className="text-xs font-black text-amber-700 mb-1 flex items-center gap-1">
            <ThumbsUp size={11} /> Tip
          </div>
          <p className="text-xs text-amber-800">{exp.tips}</p>
        </div>
      )}
    </div>
  );
}

// ─── Submit Experience Form ───────────────────────────────────────────────────

function SubmitExperienceForm({ slug, onSubmitted }: { slug: string; onSubmitted: () => void }) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const [form, setForm] = useState({ role: "", year: new Date().getFullYear(), experience: "", result: "pending", rounds: "", tips: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim() || !form.experience.trim()) {
      setError("Role and experience are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await interviewExpApi.submit(slug, {
        ...form,
        rounds: form.rounds
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      setSubmitted(true);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <User size={20} className="text-primary" />
        </div>
        <h3 className="font-black text-slate-900 mb-2">Share Your Experience</h3>
        <p className="text-slate-500 text-sm mb-5">Login to share your interview experience and help other students.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("/login")} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">
            Log In
          </button>
          <button onClick={() => navigate("/signup")} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all">
            Sign Up
          </button>
        </div>
      </div>
    );
  }
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </div>
        <h3 className="font-black text-slate-900 mb-2">Experience Submitted!</h3>
        <p className="text-slate-500 text-sm">Your experience will appear here after admin review. Thank you!</p>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
        <Send size={15} className="text-primary" /> Share Your Interview Experience
      </h3>
      <p className="text-slate-500 text-xs mb-5">Help fellow students by sharing what you went through.</p>
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Role Applied For *</label>
            <input type="text" placeholder="e.g. Programmer Analyst Trainee" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Year</label>
            <input type="number" min={2015} max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Interview Result</label>
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className={`${inputCls} bg-white`}>
              <option value="selected">Selected ✅</option>
              <option value="rejected">Rejected ❌</option>
              <option value="pending">Awaiting Result ⏳</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Rounds (comma separated)</label>
            <input type="text" placeholder="e.g. Aptitude, Coding, HR" value={form.rounds} onChange={(e) => setForm({ ...form, rounds: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Experience *</label>
          <textarea rows={6} placeholder="Describe your interview experience..." value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className={`${inputCls} resize-none`} required />
          <div className="text-right text-xs text-slate-400 mt-1">{form.experience.length} chars</div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Tips for Future Candidates (optional)</label>
          <textarea rows={2} placeholder="One key advice..." value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })} className={`${inputCls} resize-none`} />
        </div>
        <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20">
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send size={14} /> Submit Experience
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 text-center">Your experience will go live after admin approval.</p>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanyPreparationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const isAdmin = storedUser?.role === "admin";

  const [company, setCompany] = useState<Company | null>(null);
  const [prepContent, setPrepContent] = useState<PrepData>({});
  const [questions, setQuestions] = useState<QuestionData>({});
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("aptitude");

  // Admin UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PrepQuestion | null>(null);

  const loadExperiences = async () => {
    if (!slug) return;
    try {
      setExperiences(await interviewExpApi.getByCompany(slug));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([companyApi.getPrepContent(slug), interviewExpApi.getByCompany(slug)])
      .then(([prepData, expData]) => {
        setCompany(prepData.company);
        setPrepContent(prepData.prepContent || {});
        setQuestions(prepData.questions || {});
        setExperiences(expData);
      })
      .catch(() => setError("Failed to load preparation content."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleQuestionSaved = (saved: PrepQuestion) => {
    setQuestions((prev) => {
      const cat = saved.category as keyof QuestionData;
      const existing = prev[cat] || [];
      if (editTarget) {
        return { ...prev, [cat]: existing.map((q) => (q._id === saved._id ? saved : q)) };
      }
      return { ...prev, [cat]: [...existing, saved] };
    });
    setShowAddForm(false);
    setEditTarget(null);
  };

  const handleQuestionDelete = async (qId: string) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    try {
      await companyApi.deleteQuestion(qId);
      setQuestions((prev) => {
        const cat = activeTab as keyof QuestionData;
        return { ...prev, [cat]: (prev[cat] || []).filter((q) => q._id !== qId) };
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete question.");
    }
  };

  const handleEditQuestion = (q: PrepQuestion) => {
    setEditTarget(q);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditTarget(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-sm">Loading preparation content...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Content not available</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <Link to="/company-prep" className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all">
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const currentContent = activeTab !== "experiences" ? prepContent[activeTab as keyof PrepData] || [] : [];
  const currentQuestions = activeTab !== "experiences" ? questions[activeTab as keyof QuestionData] || [] : [];
  const experienceCount = experiences.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/company-prep/${slug}`)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{company.name}</span>
            </button>
            <ChevronRight size={14} className="text-slate-300 hidden sm:block" />
            <span className="text-sm font-bold text-primary hidden sm:block">Preparation</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="flex lg:hidden items-center gap-1.5 text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 uppercase tracking-wider">
                <Shield size={10} /> Admin Mode
              </span>
            )}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <Zap size={13} className="text-white fill-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 hidden sm:block">
                beyond<span className="text-primary">basic</span>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className={`${company.color} text-white py-8 sm:py-10 px-4 sm:px-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/70 text-sm font-semibold">{company.name}</span>
            <ChevronRight size={14} className="text-white/50" />
            <span className="text-white font-bold text-sm">Preparation Guide</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">Crack {company.name} — Complete Prep</h1>
          <p className="text-white/75 text-sm">Aptitude · DSA · Communication · LLD · HLD · Interview Experiences</p>
        </div>
      </div>

      {/* Tab Nav — mobile only */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-40 lg:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const qCount = tab.key !== "experiences" ? (questions[tab.key as keyof QuestionData] || []).length : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setShowAddForm(false);
                    setEditTarget(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 relative ${isActive ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"}`}
                >
                  <Icon size={14} />
                  {tab.key === "experiences" ? `Interview Exp. (${experienceCount})` : tab.label}
                  {qCount > 0 && <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${isActive ? "bg-primary/15 text-primary" : "bg-slate-100 text-slate-500"}`}>{qCount}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-column layout: Sidebar + Content */}
      <div className="max-w-6xl mx-auto flex">

        {/* LEFT SIDEBAR — desktop */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-100 bg-white sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Preparation Guide</p>
            <h3 className="text-sm font-black text-slate-800 truncate">{company.name}</h3>
          </div>
          <nav className="p-3 flex-1 space-y-0.5">
            {TABS.map((tab) => {
              const SideIcon = tab.icon;
              const isActiveSide = activeTab === tab.key;
              const sideCount = tab.key === "experiences" ? experienceCount : (questions[tab.key as keyof QuestionData] || []).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setShowAddForm(false); setEditTarget(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${isActiveSide ? "bg-primary/10 text-primary font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActiveSide ? "bg-primary/20" : "bg-slate-100"}`}>
                    <SideIcon size={14} className={isActiveSide ? "text-primary" : "text-slate-500"} />
                  </div>
                  <span className="flex-1 truncate">{tab.key === "experiences" ? "Interview Exp." : tab.label}</span>
                  {sideCount > 0 && (
                    <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 flex-shrink-0 ${isActiveSide ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-500"}`}>
                      {sideCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {isAdmin && (
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3 py-2 uppercase tracking-wider">
                <Shield size={10} /> Admin Mode
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT CONTENT */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 py-8 space-y-8">
        {/* ── Admin: Add Question Form ── */}
        {isAdmin && activeTab !== "experiences" && showAddForm && <AdminQuestionForm category={activeTab} companyId={company._id} editTarget={editTarget} onSaved={handleQuestionSaved} onCancel={cancelForm} />}

        {/* ── Prep Content (theory/guide sections) ── */}
        {activeTab !== "experiences" && (
          <>
            {currentContent.length > 0 && (
              <div className="space-y-8">
                {currentContent.map((item) => (
                  <div key={item._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <BookOpen size={15} className="text-primary" />
                        <h2 className="font-black text-slate-900 text-base">{item.title}</h2>
                      </div>
                    </div>
                    <div className="px-6 py-6">
                      <MarkdownContent text={item.content} />
                    </div>
                    {item.resources?.length > 0 && (
                      <div className="px-6 pb-6">
                        <div className="bg-slate-50 rounded-xl p-4">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <ExternalLink size={11} /> Resources
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.resources.map((res, idx) => (
                              <div key={idx} className={`flex items-center gap-2.5 text-sm font-medium py-2 px-3 rounded-lg bg-white border border-slate-200 ${res.url ? "hover:border-primary/40 hover:text-primary cursor-pointer transition-all" : "text-slate-500"}`} onClick={() => res.url && window.open(res.url, "_blank")}>
                                <span className="text-base flex-shrink-0">{RESOURCE_ICONS[res.type] || "📄"}</span>
                                <span className="truncate">{res.title}</span>
                                {res.url && <ExternalLink size={11} className="ml-auto flex-shrink-0 text-slate-400" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Questions Section ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Code2 size={15} className="text-primary" />
                  Practice Questions
                  {currentQuestions.length > 0 && <span className="text-xs font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">{currentQuestions.length}</span>}
                </h2>
                {isAdmin && !showAddForm && (
                  <button
                    onClick={() => {
                      setEditTarget(null);
                      setShowAddForm(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    <Plus size={13} /> Add Question
                  </button>
                )}
              </div>

              {currentQuestions.length === 0 ? (
                <div className={`rounded-2xl border-2 border-dashed p-10 text-center ${isAdmin ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-white"}`}>
                  <div className="text-4xl mb-3">📝</div>
                  <h3 className="font-black text-slate-800 mb-1">No questions yet</h3>
                  <p className="text-slate-500 text-sm mb-4">{isAdmin ? `Add questions for the ${activeTab.toUpperCase()} section to help students practise.` : `Questions for this section are coming soon.`}</p>
                  {isAdmin && !showAddForm && (
                    <button
                      onClick={() => {
                        setEditTarget(null);
                        setShowAddForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all"
                    >
                      <Plus size={14} /> Add First Question
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentQuestions.map((q, idx) => (
                    <QuestionCard key={q._id} q={q} index={idx} isAdmin={isAdmin} onEdit={handleEditQuestion} onDelete={handleQuestionDelete} />
                  ))}
                  {isAdmin && !showAddForm && (
                    <button
                      onClick={() => {
                        setEditTarget(null);
                        setShowAddForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-primary/30 text-primary text-sm font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add Another Question
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Empty state when no content at all */}
            {currentContent.length === 0 && currentQuestions.length === 0 && !showAddForm && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <div className="text-5xl mb-4">🚧</div>
                <h3 className="font-black text-slate-900 mb-2">Content Coming Soon</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">{isAdmin ? `Start adding content for the ${activeTab.toUpperCase()} section.` : `Our team is preparing ${activeTab.toUpperCase()} content for ${company.name}. Check back soon!`}</p>
              </div>
            )}
          </>
        )}

        {/* ── Experiences Tab ── */}
        {activeTab === "experiences" && (
          <div className="space-y-6">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Star size={15} className="text-primary" />
              Interview Experiences
              {experienceCount > 0 && <span className="text-xs font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">{experienceCount}</span>}
            </h2>
            {experiences.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-slate-100">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-black text-slate-900 mb-2">No experiences yet</h3>
                <p className="text-slate-500 text-sm">Be the first to share your {company.name} interview experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <ExperienceCard key={exp._id} exp={exp} />
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Share Your Experience</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <SubmitExperienceForm slug={slug!} onSubmitted={loadExperiences} />
          </div>
        )}
        </div>{/* end right content */}
      </div>{/* end two-column layout */}

      {/* Bottom discuss section (non-experience tabs) */}
      {activeTab !== "experiences" && (
        <div className="border-t border-slate-200 bg-white py-10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-slate-900 mb-2">Share Your {company.name} Interview Experience</h2>
              <p className="text-slate-500 text-sm">Help other students by sharing your experience. Every submission is reviewed before it goes live.</p>
              <button onClick={() => setActiveTab("experiences")} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                View all experiences <ChevronRight size={14} />
              </button>
            </div>
            <SubmitExperienceForm slug={slug!} onSubmitted={loadExperiences} />
          </div>
        </div>
      )}
    </div>
  );
}
