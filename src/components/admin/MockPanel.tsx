import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, ClipboardList, Eye, EyeOff, ListChecks, ArrowLeft } from "lucide-react";
import { mockApi } from "../../lib/api";
import type { MockExam, MockQuestion, MockSection } from "@/types/models";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BANNERS = [
  "from-blue-500 via-violet-500 to-purple-700",
  "from-rose-500 via-red-500 to-orange-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-red-500",
];

interface ExamForm {
  title: string;
  slug: string;
  description: string;
  instructions: string;
  duration: number;
  passingScore: number;
  tags: string;
  banner: string;
  isPublished: boolean;
}

interface QuestionForm {
  section: MockSection;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  order: number;
}

const EXAM_BLANK: ExamForm = { title: "", slug: "", description: "", instructions: "", duration: 60, passingScore: 60, tags: "", banner: BANNERS[0], isPublished: false };
const Q_BLANK: QuestionForm = { section: "aptitude", question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "", difficulty: "Easy", order: 0 };

export default function MockPanel() {
  const [exams, setExams]         = useState<MockExam[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showExamModal, setShowE] = useState(false);
  const [editExam, setEditE]      = useState<MockExam | null>(null);
  const [examForm, setEF]         = useState<ExamForm>({ ...EXAM_BLANK });
  const [savingE, setSavingE]     = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [error, setError]         = useState("");

  // Question management state
  const [activeExam, setActiveExam] = useState<MockExam | null>(null);
  const [questions, setQs]          = useState<MockQuestion[]>([]);
  const [loadingQ, setLoadingQ]     = useState(false);
  const [showQModal, setShowQM]     = useState(false);
  const [editQ, setEditQ]           = useState<MockQuestion | null>(null);
  const [qForm, setQF]              = useState<QuestionForm>({ ...Q_BLANK, options: ["", "", "", ""] });
  const [savingQ, setSavingQ]       = useState(false);
  const [deleteQId, setDeleteQId]   = useState<string | null>(null);
  const [qError, setQError]         = useState("");

  const loadExams = () => mockApi.getAll().then((d: MockExam[]) => { setExams(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { loadExams(); }, []);

  const loadQuestions = async (exam: MockExam) => {
    setActiveExam(exam); setLoadingQ(true);
    const qs = await mockApi.getQuestionsAdmin(exam._id);
    setQs(Array.isArray(qs) ? qs : []); setLoadingQ(false);
  };

  // Exam CRUD
  const openCreateExam = () => { setEditE(null); setEF({ ...EXAM_BLANK }); setError(""); setShowE(true); };
  const openEditExam = (item: MockExam) => {
    setEditE(item);
    setEF({ title: item.title, slug: item.slug, description: item.description || "", instructions: item.instructions || "", duration: item.duration ?? 60, passingScore: item.passingScore ?? 60, tags: (item.tags || []).join(", "), banner: item.banner || BANNERS[0], isPublished: item.isPublished ?? false });
    setError(""); setShowE(true);
  };
  const submitExam = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingE(true); setError("");
    const payload = { ...examForm, tags: examForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean) };
    try {
      if (editExam) await mockApi.update(editExam._id, payload);
      else await mockApi.create(payload);
      setShowE(false); await loadExams();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setSavingE(false); }
  };
  const handleDeleteExam = async () => {
    if (!deleteId) return;
    try { await mockApi.delete(deleteId); setDeleteId(null); if (activeExam?._id === deleteId) setActiveExam(null); await loadExams(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  // Question CRUD
  const openCreateQ = () => { setEditQ(null); setQF({ ...Q_BLANK, options: ["", "", "", ""] }); setQError(""); setShowQM(true); };
  const openEditQ = (q: MockQuestion) => {
    setEditQ(q);
    setQF({ section: q.section, question: q.question, options: [...q.options], correctAnswer: q.correctAnswer, explanation: q.explanation || "", difficulty: q.difficulty || "Easy", order: q.order ?? 0 });
    setQError(""); setShowQM(true);
  };
  const submitQ = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingQ(true); setQError("");
    try {
      if (editQ) await mockApi.updateQuestion(editQ._id, qForm);
      else await mockApi.addQuestion(activeExam!._id, qForm);
      setShowQM(false); await loadQuestions(activeExam!);
      await loadExams();
    } catch (err: unknown) { setQError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setSavingQ(false); }
  };
  const handleDeleteQ = async () => {
    if (!deleteQId) return;
    try { await mockApi.deleteQuestion(deleteQId); setDeleteQId(null); await loadQuestions(activeExam!); await loadExams(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>{children}</div>
  );
  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const SECTION_COLORS: Record<string, string> = { aptitude: "bg-blue-100 text-blue-700", communication: "bg-violet-100 text-violet-700", coding: "bg-emerald-100 text-emerald-700", sql: "bg-amber-100 text-amber-700" };

  // Question management view
  if (activeExam) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveExam(null)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Exams
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-black text-slate-900 truncate">{activeExam.title}</span>
          <span className="ml-auto text-xs font-bold text-slate-500">{questions.length} questions</span>
          <button onClick={openCreateQ} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loadingQ ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400"><ListChecks className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No questions yet — add one!</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["#", "Section", "Question", "Correct", "Difficulty", "Actions"].map(h => (
                      <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {questions.map((q, idx) => (
                    <tr key={q._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${SECTION_COLORS[q.section] || "bg-slate-100 text-slate-600"}`}>{q.section}</span></td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{q.question}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-700">{q.options[q.correctAnswer]?.slice(0, 30)}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${q.difficulty === "Easy" ? "bg-green-100 text-green-700" : q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{q.difficulty}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEditQ(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteQId(q._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Question modal */}
        {showQModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h2 className="font-black text-slate-900">{editQ ? "Edit Question" : "New Question"}</h2>
                <button onClick={() => setShowQM(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submitQ} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <F label="Section">
                    <select className={inp} value={qForm.section} onChange={e => setQF(f => ({ ...f, section: e.target.value as MockSection }))}>
                      {["aptitude","communication","coding","sql"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Difficulty">
                    <select className={inp} value={qForm.difficulty} onChange={e => setQF(f => ({ ...f, difficulty: e.target.value as "Easy" | "Medium" | "Hard" }))}>
                      {["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </F>
                </div>
                <F label="Question *">
                  <textarea className={inp} rows={3} value={qForm.question} required onChange={e => setQF(f => ({ ...f, question: e.target.value }))} />
                </F>
                {[0,1,2,3].map(i => (
                  <F key={i} label={`Option ${i+1} ${i === qForm.correctAnswer ? "✓ Correct" : ""}`}>
                    <input className={`${inp} ${i === qForm.correctAnswer ? "border-green-400 bg-green-50" : ""}`} value={qForm.options[i]} required
                      onChange={e => { const opts = [...qForm.options]; opts[i] = e.target.value; setQF(f => ({ ...f, options: opts })); }} />
                  </F>
                ))}
                <F label="Correct Answer">
                  <select className={inp} value={qForm.correctAnswer} onChange={e => setQF(f => ({ ...f, correctAnswer: Number(e.target.value) }))}>
                    {[0,1,2,3].map(i => <option key={i} value={i}>Option {i+1}</option>)}
                  </select>
                </F>
                <F label="Explanation">
                  <textarea className={inp} rows={2} value={qForm.explanation} onChange={e => setQF(f => ({ ...f, explanation: e.target.value }))} />
                </F>
                {qError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{qError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowQM(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={savingQ} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingQ && <Loader2 className="w-4 h-4 animate-spin" />}{editQ ? "Save" : "Add Question"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteQId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-black text-slate-900 mb-2">Delete Question?</h3>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteQId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button onClick={handleDeleteQ} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Exam list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-semibold">{exams.length} exam{exams.length !== 1 ? "s" : ""}</p>
        <button onClick={openCreateExam} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Exam
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><ClipboardList className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No mock exams yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Title", "Duration", "Questions", "Pass %", "Status", "Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {exams.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${item.banner || BANNERS[0]} flex-shrink-0`} />
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-[160px]">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.duration} min</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.totalQuestions ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">{item.passingScore}%</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold w-fit ${item.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.isPublished ? <><Eye className="w-3 h-3" />Live</> : <><EyeOff className="w-3 h-3" />Draft</>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => loadQuestions(item)} title="Manage Questions"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><ListChecks className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEditExam(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editExam ? "Edit Exam" : "New Exam"}</h2>
              <button onClick={() => setShowE(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitExam} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Title *">
                  <input className={inp} value={examForm.title} required
                    onChange={e => setEF(f => ({ ...f, title: e.target.value, slug: editExam ? f.slug : toSlug(e.target.value) }))} />
                </F>
                <F label="Slug *">
                  <input className={inp} value={examForm.slug} required onChange={e => setEF(f => ({ ...f, slug: e.target.value }))} />
                </F>
              </div>
              <F label="Description">
                <textarea className={inp} rows={2} value={examForm.description} onChange={e => setEF(f => ({ ...f, description: e.target.value }))} />
              </F>
              <F label="Instructions">
                <textarea className={inp} rows={3} value={examForm.instructions} onChange={e => setEF(f => ({ ...f, instructions: e.target.value }))} />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Duration (min)"><input type="number" className={inp} min={5} value={examForm.duration} onChange={e => setEF(f => ({ ...f, duration: Number(e.target.value) }))} /></F>
                <F label="Passing Score (%)"><input type="number" className={inp} min={0} max={100} value={examForm.passingScore} onChange={e => setEF(f => ({ ...f, passingScore: Number(e.target.value) }))} /></F>
              </div>
              <F label="Tags (comma-separated)">
                <input className={inp} value={examForm.tags} placeholder="DSA, Aptitude, SQL" onChange={e => setEF(f => ({ ...f, tags: e.target.value }))} />
              </F>
              <F label="Banner">
                <div className="flex flex-wrap gap-2 mt-1">
                  {BANNERS.map(b => (
                    <button key={b} type="button" onClick={() => setEF(f => ({ ...f, banner: b }))}
                      className={`h-8 w-20 rounded-lg bg-gradient-to-r ${b} ${examForm.banner === b ? "ring-2 ring-offset-2 ring-slate-900" : ""}`} />
                  ))}
                </div>
              </F>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="mpub" checked={examForm.isPublished} onChange={e => setEF(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                <label htmlFor="mpub" className="text-sm font-semibold text-slate-700">Published</label>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowE(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={savingE} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingE && <Loader2 className="w-4 h-4 animate-spin" />}{editExam ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Exam?</h3>
            <p className="text-sm text-slate-500 mb-5">All questions and attempts will be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
              <button onClick={handleDeleteExam} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
