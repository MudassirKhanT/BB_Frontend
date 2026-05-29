import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Trophy,
  ArrowLeft, ChevronRight, Code2, Play,
} from "lucide-react";
import { contestApi, adminProblemApi } from "../../lib/api";
import {
  Contest, ContestProblemEntry, Problem, getErrorMessage,
} from "@/types/models";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BANNERS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700", "from-cyan-500 to-cyan-700",
];

const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>{children}</div>
);

const DIFF_COLOR: Record<string, string> = {
  Easy: "bg-green-100 text-green-700", Medium: "bg-yellow-100 text-yellow-700", Hard: "bg-red-100 text-red-700",
};

const toLocalDT = (iso: string) => iso ? new Date(iso).toISOString().slice(0,16) : "";
const fromLocalDT = (local: string) => local ? new Date(local).toISOString() : "";

const BLANK_TC = { input: "", expectedOutput: "", isHidden: false };
const BLANK_EXAMPLE = { input: "", output: "", explanation: "" };

interface ContestForm {
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  banner: string;
  type: "weekly" | "monthly" | "custom";
  isPublished: boolean;
}

interface NewProblemForm {
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  topicTag: string;
  examples: { input: string; output: string; explanation: string }[];
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  starterCode: Record<string, string>;
  points: number;
  isPublished: boolean;
}

// ── Contest Problems Manager ───────────────────────────────────────────────────
function ContestProblemsView({ contest, onBack }: { contest: Contest; onBack: () => void }) {
  const [contestData, setContestData] = useState<Contest | null>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<"existing"|"new"|null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [points, setPoints] = useState(100);
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [error, setError] = useState("");
  const [langTab, setLangTab] = useState("python");
  const LANGS = ["python","javascript","cpp","java"];

  const [newProblem, setNewProblem] = useState<NewProblemForm>({
    title: "", slug: "", difficulty: "Medium", description: "", topicTag: "",
    examples: [{ ...BLANK_EXAMPLE }],
    testCases: [{ ...BLANK_TC }],
    starterCode: { python: "", javascript: "", cpp: "", java: "" },
    points: 100, isPublished: true,
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      contestApi.getBySlug(contest.slug),
      adminProblemApi.getAll(),
    ]).then(([cd, ap]: [Contest, Problem[]]) => {
      setContestData(cd);
      setAllProblems(Array.isArray(ap) ? ap : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [contest.slug]);

  useEffect(() => { load(); }, [load]);

  const contestProblems: ContestProblemEntry[] = contestData?.problems || [];
  const usedIds = new Set(contestProblems.map((p) => {
    const prob = p.problem;
    return typeof prob === "string" ? prob : prob._id;
  }));
  const availableProblems = allProblems.filter(p => !usedIds.has(p._id));

  const handleAddExisting = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProblemId) return;
    setAdding(true); setError("");
    try {
      await contestApi.addProblem(contest._id, { problemId: selectedProblemId, points, order: contestProblems.length + 1 });
      setAddMode(null); setSelectedProblemId(""); setPoints(100); load();
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setAdding(false); }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true); setError("");
    try {
      const { points: pts, ...problemData } = newProblem;
      await contestApi.createProblem(contest._id, { ...problemData, points: pts, order: contestProblems.length + 1 });
      setAddMode(null);
      setNewProblem({ title:"", slug:"", difficulty:"Medium", description:"", topicTag:"", examples:[{...BLANK_EXAMPLE}], testCases:[{...BLANK_TC}], starterCode:{python:"",javascript:"",cpp:"",java:""}, points:100, isPublished:true });
      load();
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setAdding(false); }
  };

  const handleRemove = async () => {
    if (!deleteId) return;
    try { await contestApi.removeProblem(contest._id, deleteId); setDeleteId(null); load(); }
    catch (err: unknown) { alert(getErrorMessage(err)); }
  };

  const setNpEx = (i: number, k: string, v: string) =>
    setNewProblem(p => ({ ...p, examples: p.examples.map((ex, j) => j===i ? { ...ex, [k]: v } : ex) }));
  const setNpTc = (i: number, k: string, v: string | boolean) =>
    setNewProblem(p => ({ ...p, testCases: p.testCases.map((tc, j) => j===i ? { ...tc, [k]: v } : tc) }));

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <p className="text-xs text-slate-400 font-semibold">Contest Problems</p>
          <h3 className="font-black text-lg text-slate-900">{contest.title}</h3>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setAddMode("existing")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100">
            <Plus className="w-4 h-4" /> Add Existing
          </button>
          <button onClick={() => setAddMode("new")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Create New
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {contestProblems.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <Code2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-semibold">No problems yet</p>
            <p className="text-sm">Add problems to this contest</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["#","Problem","Difficulty","Topic","Points","Test Cases","Actions"].map(h => (
                <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contestProblems.map((cp, i) => {
                const p = typeof cp.problem === "string" ? ({} as Partial<Problem>) : (cp.problem as Problem);
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 font-semibold">{cp.order||i+1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.title || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${DIFF_COLOR[p.difficulty ?? ""]||""}`}>{p.difficulty}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.topicTag}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{cp.points}</td>
                    <td className="px-4 py-3 text-slate-600">{(p.testCases||[]).length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => setDeleteId(p._id ?? "")} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Existing Modal */}
      {addMode === "existing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">Add Existing Problem</h3>
              <button onClick={() => setAddMode(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddExisting} className="space-y-3">
              <F label="Select Problem">
                <select className={inp} value={selectedProblemId} required onChange={e => setSelectedProblemId(e.target.value)}>
                  <option value="">— Choose a problem —</option>
                  {availableProblems.map(p => (
                    <option key={p._id} value={p._id}>[{p.difficulty}] {p.title}</option>
                  ))}
                </select>
              </F>
              <F label="Points">
                <input type="number" min={1} className={inp} value={points} onChange={e => setPoints(Number(e.target.value))} />
              </F>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddMode(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />} Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Problem Modal */}
      {addMode === "new" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-black text-slate-900">Create & Add Problem</h3>
              <button onClick={() => setAddMode(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateNew} className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <F label="Title *">
                  <input className={inp} value={newProblem.title} required
                    onChange={e => setNewProblem(p => ({ ...p, title: e.target.value, slug: toSlug(e.target.value) }))} />
                </F>
                <F label="Slug *">
                  <input className={inp} value={newProblem.slug} required onChange={e => setNewProblem(p => ({ ...p, slug: e.target.value }))} />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <F label="Difficulty">
                  <select className={inp} value={newProblem.difficulty} onChange={e => setNewProblem(p => ({ ...p, difficulty: e.target.value }))}>
                    {["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </F>
                <F label="Topic Tag *">
                  <input className={inp} value={newProblem.topicTag} required placeholder="Arrays, Graphs…"
                    onChange={e => setNewProblem(p => ({ ...p, topicTag: e.target.value }))} />
                </F>
                <F label="Points">
                  <input type="number" min={1} className={inp} value={newProblem.points}
                    onChange={e => setNewProblem(p => ({ ...p, points: Number(e.target.value) }))} />
                </F>
              </div>
              <F label="Description (Markdown) *">
                <textarea className={inp + " font-mono text-xs"} rows={6} required value={newProblem.description}
                  placeholder="## Problem Statement&#10;Given…"
                  onChange={e => setNewProblem(p => ({ ...p, description: e.target.value }))} />
              </F>

              {/* Examples */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Examples</p>
                  <button type="button" onClick={() => setNewProblem(p => ({ ...p, examples: [...p.examples, { ...BLANK_EXAMPLE }] }))}
                    className="text-xs font-bold text-primary hover:underline">+ Add</button>
                </div>
                {newProblem.examples.map((ex, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-slate-500 font-semibold mb-1">Input</p>
                        <textarea rows={2} value={ex.input} onChange={e => setNpEx(i,"input",e.target.value)} className={inp + " font-mono text-xs"} /></div>
                      <div><p className="text-xs text-slate-500 font-semibold mb-1">Output</p>
                        <textarea rows={2} value={ex.output} onChange={e => setNpEx(i,"output",e.target.value)} className={inp + " font-mono text-xs"} /></div>
                    </div>
                    <input value={ex.explanation} onChange={e => setNpEx(i,"explanation",e.target.value)}
                      placeholder="Explanation (optional)" className={inp} />
                    {newProblem.examples.length > 1 && (
                      <button type="button" onClick={() => setNewProblem(p => ({ ...p, examples: p.examples.filter((_,j) => j!==i) }))}
                        className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Test Cases */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Test Cases</p>
                  <button type="button" onClick={() => setNewProblem(p => ({ ...p, testCases: [...p.testCases, { ...BLANK_TC }] }))}
                    className="text-xs font-bold text-primary hover:underline">+ Add</button>
                </div>
                {newProblem.testCases.map((tc, i) => (
                  <div key={i} className={`border rounded-xl p-3 space-y-2 ${tc.isHidden?"border-orange-200 bg-orange-50":"border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                        <input type="checkbox" checked={tc.isHidden} onChange={e => setNpTc(i,"isHidden",e.target.checked)} /> Hidden
                      </label>
                      {newProblem.testCases.length > 1 && (
                        <button type="button" onClick={() => setNewProblem(p => ({ ...p, testCases: p.testCases.filter((_,j)=>j!==i) }))}
                          className="text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-slate-500 font-semibold mb-1">Input</p>
                        <textarea rows={2} value={tc.input} onChange={e => setNpTc(i,"input",e.target.value)} className={inp + " font-mono text-xs"} /></div>
                      <div><p className="text-xs text-slate-500 font-semibold mb-1">Expected Output</p>
                        <textarea rows={2} value={tc.expectedOutput} onChange={e => setNpTc(i,"expectedOutput",e.target.value)} className={inp + " font-mono text-xs"} /></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Starter Code */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Starter Code</p>
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {LANGS.map(l => (
                    <button key={l} type="button" onClick={() => setLangTab(l)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${langTab===l?"bg-white text-slate-900 shadow-sm":"text-slate-500"}`}>{l}</button>
                  ))}
                </div>
                <textarea
                  value={(newProblem.starterCode as Record<string, string>)[langTab] || ""}
                  onChange={e => setNewProblem(p => ({ ...p, starterCode: { ...p.starterCode, [langTab]: e.target.value } }))}
                  rows={6} placeholder={`# ${langTab} starter code`} className={inp + " font-mono text-xs"} />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1 border-t border-slate-100">
                <button type="button" onClick={() => setAddMode(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />} Create & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Remove from Contest?</h3>
            <p className="text-sm text-slate-500 mb-5">The problem will be removed from this contest (not deleted).</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
              <button onClick={handleRemove} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ContestPanel ──────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: "custom",  label: "Custom" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const BLANK_CONTEST: ContestForm = {
  title: "", slug: "", description: "", startTime: "", endTime: "", banner: BANNERS[0], type: "custom", isPublished: false,
};

export default function ContestPanel() {
  const [items, setItems]       = useState<Contest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShow]    = useState(false);
  const [editItem, setEdit]     = useState<Contest | null>(null);
  const [form, setForm]         = useState<ContestForm>({ ...BLANK_CONTEST });
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [activeContest, setActiveContest] = useState<Contest | null>(null);

  const load = () => contestApi.adminGetAll().then((d: { contests?: Contest[] } | Contest[]) => {
    setItems(Array.isArray(d) ? d : (d as { contests?: Contest[] }).contests ?? []);
    setLoading(false);
  });
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEdit(null); setForm({ ...BLANK_CONTEST }); setError(""); setShow(true); };
  const openEdit   = (item: Contest) => {
    setEdit(item);
    setForm({ title: item.title, slug: item.slug, description: item.description||"",
      startTime: toLocalDT(item.startTime), endTime: toLocalDT(item.endTime),
      banner: item.banner||BANNERS[0], type: item.type||"custom", isPublished: item.isPublished??false });
    setError(""); setShow(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const payload = { ...form, startTime: fromLocalDT(form.startTime), endTime: fromLocalDT(form.endTime) };
    try {
      if (editItem) await contestApi.update(editItem._id, payload);
      else await contestApi.create(payload);
      setShow(false); await load();
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await contestApi.delete(deleteId); setDeleteId(null); await load(); }
    catch (err: unknown) { alert(getErrorMessage(err)); }
  };

  const handleStart = async (id: string) => {
    setStartingId(id);
    try { await contestApi.start(id); await load(); }
    catch (err: unknown) { alert(getErrorMessage(err)); }
    finally { setStartingId(null); }
  };

  const getStatus = (item: Contest) => {
    const now = Date.now();
    const start = new Date(item.startTime).getTime();
    const end   = new Date(item.endTime).getTime();
    if (now < start) return "upcoming";
    if (now > end)   return "ended";
    return "live";
  };

  if (activeContest) return <ContestProblemsView contest={activeContest} onBack={() => setActiveContest(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-semibold">{items.length} contest{items.length !== 1 ? "s" : ""}</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Contest
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><Trophy className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No contests yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Title","Type","Start","End","Problems","Registrations","Status","Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => {
                  const status = getStatus(item);
                  return (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-6 rounded-full bg-gradient-to-b ${item.banner||BANNERS[0]}`} />
                          <button onClick={() => setActiveContest(item)} className="font-bold text-slate-900 hover:text-primary flex items-center gap-1">
                            {item.title} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.type === "weekly"
                          ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700">Weekly</span>
                          : item.type === "monthly"
                          ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-violet-100 text-violet-700">Monthly</span>
                          : <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-500">Custom</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.startTime).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.endTime).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600">{(item.problems||[]).length}</td>
                      <td className="px-4 py-3 text-slate-600">{item.totalRegistrations ?? 0}</td>
                      <td className="px-4 py-3">
                        {item.isStarted && status === "live"
                          ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live</span>
                          : item.isStarted && status === "ended"
                          ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-500">Ended</span>
                          : <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700">Not Started</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {!item.isStarted && item.isPublished && (
                            <button
                              onClick={() => handleStart(item._id)}
                              disabled={startingId === item._id}
                              title="Start Contest"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {startingId === item._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                              Start
                            </button>
                          )}
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editItem ? "Edit Contest" : "New Contest"}</h2>
              <button onClick={() => setShow(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Title *">
                  <input className={inp} value={form.title} required
                    onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editItem ? f.slug : toSlug(e.target.value) }))} />
                </F>
                <F label="Slug *">
                  <input className={inp} value={form.slug} required onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                </F>
              </div>
              <F label="Description">
                <textarea className={inp} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </F>
              <F label="Contest Type">
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        form.type === opt.value
                          ? opt.value === "weekly"
                            ? "bg-blue-600 text-white border-blue-600"
                            : opt.value === "monthly"
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-slate-700 text-white border-slate-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Start Time *">
                  <input type="datetime-local" className={inp} value={form.startTime} required onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </F>
                <F label="End Time *">
                  <input type="datetime-local" className={inp} value={form.endTime} required onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </F>
              </div>
              <F label="Banner Color">
                <div className="flex flex-wrap gap-2 mt-1">
                  {BANNERS.map(b => (
                    <button key={b} type="button" onClick={() => setForm(f => ({ ...f, banner: b }))}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b} ${form.banner===b?"ring-2 ring-offset-2 ring-slate-900":""}`} />
                  ))}
                </div>
              </F>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="conpub" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                <label htmlFor="conpub" className="text-sm font-semibold text-slate-700">Published</label>
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
            <h3 className="font-black text-slate-900 mb-2">Delete Contest?</h3>
            <p className="text-sm text-slate-500 mb-5">All submissions and registrations will be permanently removed.</p>
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
