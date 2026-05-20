import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Building2,
  ArrowLeft, ChevronRight, Eye, EyeOff, BookOpen,
} from "lucide-react";
import { companyApi } from "../../lib/api";
import { Company, PrepContent, PrepQuestion, getErrorMessage } from "@/types/models";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const COLORS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700", "from-cyan-500 to-cyan-700",
  "from-slate-500 to-slate-700", "from-orange-500 to-orange-700",
];

const CATEGORIES = ["aptitude", "communication", "dsa", "sql", "lld", "hld"] as const;
type Category = typeof CATEGORIES[number];

const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>{children}</div>
);

interface PrepContentForm {
  category: Category;
  title: string;
  content: string;
  order: number;
  isPublished: boolean;
}

interface PrepQuestionForm {
  category: Category;
  type: "mcq" | "coding" | "theory";
  question: string;
  options: string[];
  answer: string;
  solution: string;
  solutionCode: string;
  solutionLanguage: string;
  difficulty: "Easy" | "Medium" | "Hard";
  order: number;
  isPublished: boolean;
}

interface CompanyForm {
  name: string;
  slug: string;
  type: string;
  description: string;
  overview: string;
  website: string;
  logo: string;
  color: string;
  hiringDetails: { ctc: string; selectionRate: number; eligibility: string };
  isPublished: boolean;
}

const BLANK_CONTENT: PrepContentForm = { category: "dsa" as Category, title: "", content: "", order: 0, isPublished: true };
const BLANK_Q: PrepQuestionForm = {
  category: "dsa" as Category, type: "theory", question: "", options: ["","","",""],
  answer: "", solution: "", solutionCode: "", solutionLanguage: "",
  difficulty: "Easy", order: 0, isPublished: true,
};

function PrepContentView({ company, onBack }: { company: Company; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Category>("dsa");
  const [contents, setContents] = useState<PrepContent[]>([]);
  const [questions, setQuestions] = useState<PrepQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCModal, setShowCModal] = useState(false);
  const [editC, setEditC] = useState<PrepContent | null>(null);
  const [formC, setFormC] = useState<PrepContentForm>({ ...BLANK_CONTENT });
  const [savingC, setSavingC] = useState(false);
  const [showQModal, setShowQModal] = useState(false);
  const [editQ, setEditQ] = useState<PrepQuestion | null>(null);
  const [formQ, setFormQ] = useState<PrepQuestionForm>({ ...BLANK_Q, options: ["","","",""] });
  const [savingQ, setSavingQ] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ id: string; kind: "content"|"question" } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    companyApi.getPrepContent(company.slug).then((d: { prepContent: PrepContent[]; questions: PrepQuestion[] }) => {
      setContents(Array.isArray(d.prepContent) ? d.prepContent : []);
      setQuestions(Array.isArray(d.questions) ? d.questions : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [company.slug]);

  useEffect(() => { load(); }, [load]);

  const tabContents  = contents.filter(c => c.category === activeTab);
  const tabQuestions = questions.filter(q => q.category === activeTab);

  const openCreateContent = () => { setEditC(null); setFormC({ ...BLANK_CONTENT, category: activeTab }); setError(""); setShowCModal(true); };
  const openEditContent   = (item: PrepContent) => { setEditC(item); setFormC({ category: item.category, title: item.title, content: item.content||"", order: item.order??0, isPublished: item.isPublished??true }); setError(""); setShowCModal(true); };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingC(true); setError("");
    try {
      if (editC) await companyApi.updatePrepContent(editC._id, formC);
      else await companyApi.createPrepContent(company._id, formC);
      setShowCModal(false); load();
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setSavingC(false); }
  };

  const openCreateQ = () => { setEditQ(null); setFormQ({ ...BLANK_Q, category: activeTab, options: ["","","",""] }); setError(""); setShowQModal(true); };
  const openEditQ   = (item: PrepQuestion) => {
    setEditQ(item);
    setFormQ({ category: item.category, type: item.type||"theory", question: item.question||"",
      options: item.options?.length===4 ? item.options : ["","","",""],
      answer: item.answer||"", solution: item.solution||"", solutionCode: item.solutionCode||"",
      solutionLanguage: item.solutionLanguage||"", difficulty: item.difficulty||"Easy",
      order: item.order??0, isPublished: item.isPublished??true });
    setError(""); setShowQModal(true);
  };

  const handleSubmitQ = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingQ(true); setError("");
    const payload = { ...formQ, options: formQ.type==="mcq" ? formQ.options.filter((o: string) => o.trim()) : [] };
    try {
      if (editQ) await companyApi.updateQuestion(editQ._id, payload);
      else await companyApi.createQuestion(company._id, payload);
      setShowQModal(false); load();
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setSavingQ(false); }
  };

  const handleDelete = async () => {
    if (!deleteInfo) return;
    try {
      if (deleteInfo.kind==="content") await companyApi.deletePrepContent(deleteInfo.id);
      else await companyApi.deleteQuestion(deleteInfo.id);
      setDeleteInfo(null); load();
    } catch (err: unknown) { alert(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <p className="text-xs text-slate-400 font-semibold">Company Prep Content</p>
          <h3 className="font-black text-lg text-slate-900">{company.name}</h3>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase ${activeTab===cat?"bg-white text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
      ) : (
        <>
          {/* Prep Content */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <p className="font-black text-slate-900 text-sm">Overview / Resources</p>
              <button onClick={openCreateContent} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100">
                <Plus className="w-3 h-3" /> Add Content
              </button>
            </div>
            {tabContents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-slate-400">
                <BookOpen className="w-8 h-8 mb-2 opacity-40" /><p className="text-sm font-semibold">No content for {activeTab.toUpperCase()}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["Order","Title","Status","Actions"].map(h => <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tabContents.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-semibold">{c.order}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{c.title}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${c.isPublished?"bg-green-100 text-green-700":"bg-slate-100 text-slate-500"}`}>{c.isPublished?"Live":"Draft"}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEditContent(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteInfo({ id: c._id, kind: "content" })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Questions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <p className="font-black text-slate-900 text-sm">Questions & Solutions ({tabQuestions.length})</p>
              <button onClick={openCreateQ} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>
            {tabQuestions.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-slate-400"><p className="text-sm font-semibold">No questions for {activeTab.toUpperCase()}</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["#","Question","Type","Difficulty","Actions"].map(h => <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tabQuestions.map((q, idx) => (
                    <tr key={q._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx+1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">{q.question}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${q.type==="mcq"?"bg-violet-100 text-violet-700":q.type==="coding"?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{q.type}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${q.difficulty==="Easy"?"bg-green-100 text-green-700":q.difficulty==="Medium"?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"}`}>{q.difficulty}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEditQ(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteInfo({ id: q._id, kind: "question" })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Prep Content Modal */}
      {showCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editC ? "Edit Content" : "Add Content"}</h2>
              <button onClick={() => setShowCModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitContent} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Category">
                  <select className={inp} value={formC.category} onChange={e => setFormC(f => ({ ...f, category: e.target.value as Category }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </F>
                <F label="Order"><input type="number" className={inp} value={formC.order} onChange={e => setFormC(f => ({ ...f, order: Number(e.target.value) }))} /></F>
              </div>
              <F label="Title *"><input className={inp} value={formC.title} required onChange={e => setFormC(f => ({ ...f, title: e.target.value }))} /></F>
              <F label="Content (Markdown)">
                <textarea className={inp + " font-mono text-xs"} rows={10}
                  placeholder="## Overview&#10;&#10;Preparation notes here…&#10;&#10;### Key Concepts&#10;- Point 1"
                  value={formC.content} onChange={e => setFormC(f => ({ ...f, content: e.target.value }))} />
              </F>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cpub" checked={formC.isPublished} onChange={e => setFormC(f => ({ ...f, isPublished: e.target.checked }))} />
                <label htmlFor="cpub" className="text-sm font-semibold text-slate-700">Published</label>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={savingC} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingC && <Loader2 className="w-4 h-4 animate-spin" />}{editC ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editQ ? "Edit Question" : "Add Question"}</h2>
              <button onClick={() => setShowQModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitQ} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <F label="Category">
                  <select className={inp} value={formQ.category} onChange={e => setFormQ(f => ({ ...f, category: e.target.value as Category }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </F>
                <F label="Type">
                  <select className={inp} value={formQ.type} onChange={e => setFormQ(f => ({ ...f, type: e.target.value as PrepQuestionForm["type"] }))}>
                    <option value="theory">Theory</option>
                    <option value="mcq">MCQ</option>
                    <option value="coding">Coding</option>
                  </select>
                </F>
                <F label="Difficulty">
                  <select className={inp} value={formQ.difficulty} onChange={e => setFormQ(f => ({ ...f, difficulty: e.target.value as PrepQuestionForm["difficulty"] }))}>
                    {["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </F>
              </div>
              <F label="Question *">
                <textarea className={inp} rows={3} required value={formQ.question}
                  placeholder="Explain the difference between…"
                  onChange={e => setFormQ(f => ({ ...f, question: e.target.value }))} />
              </F>
              {formQ.type === "mcq" && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600">Options (4 choices)</p>
                  {formQ.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                        {String.fromCharCode(65+i)}
                      </span>
                      <input value={opt} onChange={e => setFormQ(f => ({ ...f, options: f.options.map((o, j) => j===i ? e.target.value : o) }))}
                        placeholder={`Option ${String.fromCharCode(65+i)}`} className={inp} />
                    </div>
                  ))}
                  <F label="Correct Answer (A, B, C or D)">
                    <input className={inp} value={formQ.answer} placeholder="A"
                      onChange={e => setFormQ(f => ({ ...f, answer: e.target.value }))} />
                  </F>
                </div>
              )}
              {formQ.type !== "mcq" && (
                <F label="Answer / Key Points">
                  <input className={inp} value={formQ.answer} placeholder="Short answer or key points…"
                    onChange={e => setFormQ(f => ({ ...f, answer: e.target.value }))} />
                </F>
              )}
              <F label="Full Solution / Explanation (Markdown)">
                <textarea className={inp + " font-mono text-xs"} rows={6} value={formQ.solution}
                  placeholder="## Solution&#10;&#10;Detailed explanation…"
                  onChange={e => setFormQ(f => ({ ...f, solution: e.target.value }))} />
              </F>
              {formQ.type === "coding" && (
                <>
                  <F label="Solution Language">
                    <select className={inp} value={formQ.solutionLanguage}
                      onChange={e => setFormQ(f => ({ ...f, solutionLanguage: e.target.value }))}>
                      <option value="">Select language</option>
                      {["python","javascript","java","cpp","c"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </F>
                  <F label="Solution Code">
                    <textarea className={inp + " font-mono text-xs"} rows={8} value={formQ.solutionCode}
                      placeholder="def solution():&#10;    pass"
                      onChange={e => setFormQ(f => ({ ...f, solutionCode: e.target.value }))} />
                  </F>
                </>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="qpub" checked={formQ.isPublished} onChange={e => setFormQ(f => ({ ...f, isPublished: e.target.checked }))} />
                <label htmlFor="qpub" className="text-sm font-semibold text-slate-700">Published</label>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowQModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={savingQ} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingQ && <Loader2 className="w-4 h-4 animate-spin" />}{editQ ? "Save" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete {deleteInfo.kind === "content" ? "Content" : "Question"}?</h3>
            <p className="text-sm text-slate-500 mb-5">This will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteInfo(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main CompanyPanel ──────────────────────────────────────────────────────────
export default function CompanyPanel() {
  const [items, setItems]       = useState<Company[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShow]    = useState(false);
  const [editItem, setEdit]     = useState<Company | null>(null);
  const [form, setForm]         = useState<CompanyForm>({
    name: "", slug: "", type: "Product", description: "", overview: "",
    website: "", logo: "", color: COLORS[0],
    hiringDetails: { ctc: "", selectionRate: 0, eligibility: "" },
    isPublished: false,
  });
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const load = () => companyApi.getAll().then((d: Company[]) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const blankForm = (): CompanyForm => ({
    name: "", slug: "", type: "Product", description: "", overview: "",
    website: "", logo: "", color: COLORS[0],
    hiringDetails: { ctc: "", selectionRate: 0, eligibility: "" }, isPublished: false,
  });

  const openCreate = () => { setEdit(null); setForm(blankForm()); setError(""); setShow(true); };
  const openEdit = (item: Company) => {
    setEdit(item);
    setForm({
      name: item.name, slug: item.slug, type: item.type||"Product",
      description: item.description||"", overview: item.overview||"",
      website: item.website||"", logo: item.logo||"", color: item.color||COLORS[0],
      hiringDetails: { ctc: item.hiringDetails?.ctc||"", selectionRate: Number(item.hiringDetails?.selectionRate) || 0, eligibility: item.hiringDetails?.eligibility||"" },
      isPublished: item.isPublished??false,
    });
    setError(""); setShow(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editItem) await companyApi.update(editItem._id, form);
      else await companyApi.create(form);
      setShow(false); await load();
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await companyApi.delete(deleteId); setDeleteId(null); await load(); }
    catch (err: unknown) { alert(getErrorMessage(err)); }
  };

  if (activeCompany) return <PrepContentView company={activeCompany} onBack={() => setActiveCompany(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-semibold">{items.length} compan{items.length !== 1 ? "ies" : "y"}</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Company
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><Building2 className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No companies yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Company","Type","Website","Status","Actions"].map(h => <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color||COLORS[0]} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-black text-xs">{item.name[0]}</span>
                        </div>
                        <div>
                          <button onClick={() => setActiveCompany(item)} className="font-bold text-slate-900 hover:text-primary flex items-center gap-1">
                            {item.name} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <p className="text-xs text-slate-400">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">{item.type}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[140px]">{item.website||"—"}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold w-fit ${item.isPublished?"bg-green-100 text-green-700":"bg-slate-100 text-slate-500"}`}>
                        {item.isPublished ? <><Eye className="w-3 h-3" />Live</> : <><EyeOff className="w-3 h-3" />Draft</>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editItem ? "Edit Company" : "New Company"}</h2>
              <button onClick={() => setShow(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Company Name *">
                  <input className={inp} value={form.name} required
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editItem ? f.slug : toSlug(e.target.value) }))} />
                </F>
                <F label="Slug *">
                  <input className={inp} value={form.slug} required onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Type">
                  <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {["Service","Product","Startup","Consulting","FAANG"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </F>
                <F label="Website"><input className={inp} value={form.website} placeholder="https://company.com" onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></F>
              </div>
              <F label="Description *"><textarea className={inp} rows={2} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></F>
              <F label="Overview (Markdown)">
                <textarea className={inp + " font-mono text-xs"} rows={4} value={form.overview}
                  placeholder="## About&#10;Overview text here…"
                  onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} />
              </F>
              <F label="Logo URL"><input className={inp} value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} /></F>
              <div className="grid grid-cols-3 gap-4">
                <F label="CTC Range"><input className={inp} value={form.hiringDetails.ctc} placeholder="₹12-24 LPA" onChange={e => setForm(f => ({ ...f, hiringDetails: { ...f.hiringDetails, ctc: e.target.value } }))} /></F>
                <F label="Selection Rate (%)"><input type="number" min={0} max={100} className={inp} value={form.hiringDetails.selectionRate} onChange={e => setForm(f => ({ ...f, hiringDetails: { ...f.hiringDetails, selectionRate: Number(e.target.value) } }))} /></F>
                <F label="Eligibility"><input className={inp} value={form.hiringDetails.eligibility} placeholder="6.5+ CGPA" onChange={e => setForm(f => ({ ...f, hiringDetails: { ...f.hiringDetails, eligibility: e.target.value } }))} /></F>
              </div>
              <F label="Card Color">
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c} ${form.color===c?"ring-2 ring-offset-2 ring-slate-900":""}`} />
                  ))}
                </div>
              </F>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="compub" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                <label htmlFor="compub" className="text-sm font-semibold text-slate-700">Published</label>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShow(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editItem ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Company?</h3>
            <p className="text-sm text-slate-500 mb-5">All prep content and questions will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
