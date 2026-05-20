import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Code2, Search } from "lucide-react";
import { adminProblemApi, courseApi } from "../../lib/api";
import type { Problem, Course, ProblemExample, TestCase } from "@/types/models";

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
    {children}
  </div>
);

const DIFF_COLOR: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard: "bg-red-100 text-red-700",
};

const BLANK_EXAMPLE: ProblemExample = { input: "", output: "", explanation: "" };
const BLANK_TC: TestCase = { input: "", expectedOutput: "", isHidden: false };

const LANGS = ["python", "javascript", "cpp", "java"] as const;
type Lang = (typeof LANGS)[number];

interface ProblemForm {
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  topicTag: string;
  leetcodeUrl: string;
  companies: string;
  solutionArticle: string;
  frequency: number;
  courseId: string;
  order: number;
  isPublished: boolean;
  examples: ProblemExample[];
  testCases: TestCase[];
  starterCode: Record<Lang, string>;
}

const BLANK_FORM = (): ProblemForm => ({
  title: "",
  slug: "",
  difficulty: "Easy",
  description: "",
  topicTag: "",
  leetcodeUrl: "",
  companies: "",
  solutionArticle: "",
  frequency: 3,
  courseId: "",
  order: 0,
  isPublished: true,
  examples: [{ ...BLANK_EXAMPLE }],
  testCases: [{ ...BLANK_TC }],
  starterCode: { python: "", javascript: "", cpp: "", java: "" },
});

export default function ProblemsPanel() {
  const [items, setItems] = useState<Problem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShow] = useState(false);
  const [editItem, setEdit] = useState<Problem | null>(null);
  const [form, setForm] = useState<ProblemForm>(BLANK_FORM());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [langTab, setLangTab] = useState<Lang>("python");

  const load = () =>
    adminProblemApi.getAll().then((d: Problem[]) => {
      setItems(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  useEffect(() => {
    load();
    courseApi.getAllAdmin().then((d: { courses?: Course[] } | Course[]) => setCourses(Array.isArray(d) ? d : ((d as { courses?: Course[] }).courses ?? [])));
  }, []);

  const openCreate = () => {
    setEdit(null);
    setForm(BLANK_FORM());
    setError("");
    setLangTab("python");
    setShow(true);
  };
  const openEdit = (item: Problem) => {
    setEdit(item);
    setForm({
      title: item.title,
      slug: item.slug,
      difficulty: item.difficulty,
      description: item.description || "",
      topicTag: item.topicTag || "",
      leetcodeUrl: item.leetcodeUrl || "",
      companies: (item.companies || []).join(", ") || "",
      solutionArticle: item.solutionArticle || "",
      frequency: item.frequency ?? 3,
      courseId: (item.course && typeof item.course === "object" ? (item.course as { _id: string })._id : item.course) || "",
      order: item.order ?? 0,
      isPublished: item.isPublished ?? true,
      examples: item.examples?.length ? item.examples.map((e: ProblemExample) => ({ ...BLANK_EXAMPLE, ...e })) : [{ ...BLANK_EXAMPLE }],
      testCases: item.testCases?.length ? item.testCases.map((t: TestCase) => ({ ...BLANK_TC, ...t })) : [{ ...BLANK_TC }],
      starterCode: {
        python: item.starterCode?.python ?? "",
        javascript: item.starterCode?.javascript ?? "",
        cpp: item.starterCode?.cpp ?? "",
        java: item.starterCode?.java ?? "",
      },
    });
    setError("");
    setLangTab("python");
    setShow(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { courseId, companies, ...rest } = form;
    const companyList =
      typeof companies === "string"
        ? companies
            .split(",")
            .map((name: string) => name.trim())
            .filter(Boolean)
        : companies || [];
    const payload = {
      ...rest,
      companies: companyList,
      ...(courseId ? { course: courseId } : { course: null }),
    };
    try {
      if (editItem) await adminProblemApi.update(editItem._id, payload);
      else await adminProblemApi.create(payload);
      setShow(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminProblemApi.delete(deleteId);
      setDeleteId(null);
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const setExample = (i: number, k: string, v: string) => setForm(f => ({ ...f, examples: f.examples.map((ex, j) => (j === i ? { ...ex, [k]: v } : ex)) }));
  const setTc = (i: number, k: string, v: string | boolean) => setForm(f => ({ ...f, testCases: f.testCases.map((tc, j) => (j === i ? { ...tc, [k]: v } : tc)) }));

  const filtered = items.filter((i) => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.topicTag?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search problems…" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Problem
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Code2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-semibold">No problems found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Title", "Difficulty", "Topic", "Examples", "Test Cases", "Published", "Actions"].map((h) => (
                    <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h === "Actions" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] truncate">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${DIFF_COLOR[item.difficulty] || ""}`}>{item.difficulty}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.topicTag}</td>
                    <td className="px-4 py-3 text-slate-600">{(item.examples || []).length}</td>
                    <td className="px-4 py-3 text-slate-600">{(item.testCases || []).length}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{item.isPublished ? "Live" : "Draft"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editItem ? "Edit Problem" : "New Problem"}</h2>
              <button onClick={() => setShow(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              {/* ── Basic Info ── */}
              <section className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Basic Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Title *">
                    <input className={inp} value={form.title} required onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: editItem ? f.slug : toSlug(e.target.value) }))} />
                  </F>
                  <F label="Slug *">
                    <input className={inp} value={form.slug} required onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
                  </F>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <F label="Difficulty">
                    <select className={inp} value={form.difficulty} onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </F>
                  <F label="Topic Tag *">
                    <input className={inp} value={form.topicTag} required placeholder="Arrays, DP, Graphs…" onChange={(e) => setForm(f => ({ ...f, topicTag: e.target.value }))} />
                  </F>
                  <F label="Frequency (1-5)">
                    <input type="number" min={1} max={5} className={inp} value={form.frequency} onChange={(e) => setForm(f => ({ ...f, frequency: Number(e.target.value) }))} />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="LeetCode URL">
                    <input className={inp} value={form.leetcodeUrl} placeholder="https://leetcode.com/problems/…" onChange={(e) => setForm(f => ({ ...f, leetcodeUrl: e.target.value }))} />
                  </F>
                  <F label="Companies (comma-separated)">
                    <input className={inp} value={form.companies} placeholder="Google, Amazon, Facebook" onChange={(e) => setForm(f => ({ ...f, companies: e.target.value }))} />
                  </F>
                </div>
                <F label="Solution Article (HTML)">
                  <textarea className={inp + " font-mono text-xs"} rows={5} value={form.solutionArticle} placeholder="<h2>Solution</h2><p>Explain the approach.</p>" onChange={(e) => setForm(f => ({ ...f, solutionArticle: e.target.value }))} />
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Course (optional)">
                    <select className={inp} value={form.courseId} onChange={(e) => setForm(f => ({ ...f, courseId: e.target.value }))}>
                      <option value="">— Standalone —</option>
                      {courses.map((c: Course) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </F>
                </div>
                <F label="Description (Markdown) *">
                  <textarea
                    className={inp + " font-mono text-xs"}
                    rows={7}
                    value={form.description}
                    required
                    placeholder="## Problem Statement&#10;&#10;Given an array…&#10;&#10;**Constraints:**&#10;- 1 ≤ n ≤ 10^5"
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </F>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <F label="Order">
                      <input type="number" className={inp} value={form.order} onChange={(e) => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
                    </F>
                  </div>
                  <div className="flex items-end pb-1 gap-2">
                    <input type="checkbox" id="pub" checked={form.isPublished} onChange={(e) => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                    <label htmlFor="pub" className="text-sm font-semibold text-slate-700">
                      Published
                    </label>
                  </div>
                </div>
              </section>

              {/* ── Examples ── */}
              <section className="space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Examples ({form.examples.length})</p>
                  <button type="button" onClick={() => setForm(f => ({ ...f, examples: [...f.examples, { ...BLANK_EXAMPLE }] }))} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100">
                    <Plus className="w-3 h-3" /> Add Example
                  </button>
                </div>
                {form.examples.map((ex, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Example {i + 1}</span>
                      {form.examples.length > 1 && (
                        <button type="button" onClick={() => setForm(f => ({ ...f, examples: f.examples.filter((_, j) => j !== i) }))} className="p-1 text-slate-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Input</p>
                        <textarea rows={2} value={ex.input} onChange={(e) => setExample(i, "input", e.target.value)} placeholder="nums = [2,7,11,15], target = 9" className={inp + " font-mono text-xs"} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Output</p>
                        <textarea rows={2} value={ex.output} onChange={(e) => setExample(i, "output", e.target.value)} placeholder="[0,1]" className={inp + " font-mono text-xs"} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">Explanation (optional)</p>
                      <input value={ex.explanation} onChange={(e) => setExample(i, "explanation", e.target.value)} placeholder="Because nums[0] + nums[1] == 9…" className={inp} />
                    </div>
                  </div>
                ))}
              </section>

              {/* ── Test Cases ── */}
              <section className="space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Test Cases ({form.testCases.length})</p>
                  <button type="button" onClick={() => setForm(f => ({ ...f, testCases: [...f.testCases, { ...BLANK_TC }] }))} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
                    <Plus className="w-3 h-3" /> Add Test Case
                  </button>
                </div>
                <p className="text-xs text-slate-500">At least 50 hidden test cases are required for judge submissions.</p>
                {form.testCases.map((tc, i) => (
                  <div key={i} className={`border rounded-xl p-4 space-y-2 ${tc.isHidden ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">TC {i + 1}</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={tc.isHidden} onChange={(e) => setTc(i, "isHidden", e.target.checked)} className="rounded" />
                          <span className="text-xs font-semibold text-slate-600">Hidden (judge only)</span>
                          {tc.isHidden && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">Hidden</span>}
                        </label>
                      </div>
                      {form.testCases.length > 1 && (
                        <button type="button" onClick={() => setForm(f => ({ ...f, testCases: f.testCases.filter((_, j) => j !== i) }))} className="p-1 text-slate-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Input</p>
                        <textarea
                          rows={2}
                          value={tc.input}
                          onChange={(e) => setTc(i, "input", e.target.value)}
                          placeholder="2 7 11 15&#10;9"
                          className={inp + " font-mono text-xs"}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Expected Output</p>
                        <textarea rows={2} value={tc.expectedOutput} onChange={(e) => setTc(i, "expectedOutput", e.target.value)} placeholder="0 1" className={inp + " font-mono text-xs"} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* ── Starter Code ── */}
              <section className="space-y-3 border-t border-slate-100 pt-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Starter Code</p>
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {LANGS.map((lang) => (
                    <button key={lang} type="button" onClick={() => setLangTab(lang)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${langTab === lang ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                      {lang}
                    </button>
                  ))}
                </div>
                <textarea value={form.starterCode[langTab] || ""} onChange={(e) => setForm(f => ({ ...f, starterCode: { ...f.starterCode, [langTab]: e.target.value } }))} rows={8} placeholder={`# ${langTab} starter code`} className={inp + " font-mono text-xs"} />
              </section>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1 border-t border-slate-100">
                <button type="button" onClick={() => setShow(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? "Save Changes" : "Create Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Problem?</h3>
            <p className="text-sm text-slate-500 mb-5">All user submissions and solve status will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
