import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, FileText, Eye, EyeOff } from "lucide-react";
import { resourceApi } from "../../lib/api";
import type { Resource, ResourceType, ResourceDifficulty } from "@/types/models";

interface ResourceForm {
  title: string;
  slug: string;
  type: ResourceType;
  description: string;
  content: string;
  category: string;
  difficulty: ResourceDifficulty;
  authorName: string;
  coverColor: string;
  fileUrl: string;
  videoUrl: string;
  company: string;
  readTime: number;
  isPublished: boolean;
}

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const COVERS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700", "from-cyan-500 to-cyan-700",
];

const BLANK: ResourceForm = {
  title: "", slug: "", type: "dsa-note", description: "", content: "",
  category: "", difficulty: "Beginner", authorName: "BeyondBasic Team",
  coverColor: COVERS[0], fileUrl: "", videoUrl: "", company: "",
  readTime: 5, isPublished: true,
};

const TYPE_LABEL: Record<string, string> = {
  "company-paper": "Company Paper", "dsa-note": "DSA Note",
  "cs-fundamental": "CS Fundamental", "blog": "Blog",
};

export default function ResourcePanel() {
  const [items, setItems]       = useState<Resource[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShow]    = useState(false);
  const [editItem, setEdit]     = useState<Resource | null>(null);
  const [form, setForm]         = useState<ResourceForm>({ ...BLANK });
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");

  const load = () => resourceApi.getAllAdmin().then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEdit(null); setForm({ ...BLANK }); setError(""); setShow(true); };
  const openEdit = (item: Resource) => {
    setEdit(item);
    setForm({
      title: item.title, slug: item.slug, type: item.type || "dsa-note",
      description: item.description || "", content: item.content || "",
      category: item.category || "", difficulty: item.difficulty || "Beginner",
      authorName: item.authorName || "BeyondBasic Team",
      coverColor: item.coverColor || COVERS[0], fileUrl: item.fileUrl || "",
      videoUrl: item.videoUrl || "", company: item.company || "",
      readTime: item.readTime ?? 5, isPublished: item.isPublished ?? true,
    });
    setError(""); setShow(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editItem) await resourceApi.update(editItem._id, form);
      else await resourceApi.create(form);
      setShow(false); await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await resourceApi.delete(deleteId); setDeleteId(null); await load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  const filtered = items.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>{children}</div>
  );
  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…"
          className="flex-1 max-w-xs border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><FileText className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No resources found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Title", "Type", "Category", "Difficulty", "Views", "Status", "Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.coverColor || COVERS[0]} flex items-center justify-center flex-shrink-0`}>
                          <FileText className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-[160px]">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.authorName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-violet-100 text-violet-700">{TYPE_LABEL[item.type] || item.type}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.category || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.difficulty === "Beginner" ? "bg-green-100 text-green-700" : item.difficulty === "Intermediate" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{item.difficulty}</span></td>
                    <td className="px-4 py-3 text-slate-600">{item.views ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold w-fit ${item.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
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
              <h2 className="font-black text-slate-900">{editItem ? "Edit Resource" : "New Resource"}</h2>
              <button onClick={() => setShow(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Title *">
                  <input className={inp} value={form.title} required
                    onChange={e => setForm((f) => ({ ...f, title: e.target.value, slug: editItem ? f.slug : toSlug(e.target.value) }))} />
                </F>
                <F label="Slug *">
                  <input className={inp} value={form.slug} required onChange={e => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Type">
                  <select className={inp} value={form.type} onChange={e => setForm((f) => ({ ...f, type: e.target.value as ResourceType }))}>
                    {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </F>
                <F label="Difficulty">
                  <select className={inp} value={form.difficulty} onChange={e => setForm((f) => ({ ...f, difficulty: e.target.value as ResourceDifficulty }))}>
                    {["Beginner","Intermediate","Advanced"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Category"><input className={inp} value={form.category} placeholder="Arrays, OS, DBMS…" onChange={e => setForm((f) => ({ ...f, category: e.target.value }))} /></F>
                <F label="Author"><input className={inp} value={form.authorName} onChange={e => setForm((f) => ({ ...f, authorName: e.target.value }))} /></F>
              </div>
              <F label="Description">
                <textarea className={inp} rows={2} value={form.description} onChange={e => setForm((f) => ({ ...f, description: e.target.value }))} />
              </F>
              <F label="Content (Markdown)">
                <textarea className={`${inp} font-mono text-xs`} rows={6} value={form.content} placeholder="## Introduction&#10;Write markdown here…" onChange={e => setForm((f) => ({ ...f, content: e.target.value }))} />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="File URL"><input className={inp} value={form.fileUrl} onChange={e => setForm((f) => ({ ...f, fileUrl: e.target.value }))} /></F>
                <F label="Video URL"><input className={inp} value={form.videoUrl} onChange={e => setForm((f) => ({ ...f, videoUrl: e.target.value }))} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Company (optional)"><input className={inp} value={form.company} onChange={e => setForm((f) => ({ ...f, company: e.target.value }))} /></F>
                <F label="Read Time (min)"><input type="number" min={1} className={inp} value={form.readTime} onChange={e => setForm((f) => ({ ...f, readTime: Number(e.target.value) }))} /></F>
              </div>
              <F label="Cover Color">
                <div className="flex flex-wrap gap-2 mt-1">
                  {COVERS.map(c => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, coverColor: c }))}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c} ${form.coverColor === c ? "ring-2 ring-offset-2 ring-slate-900" : ""}`} />
                  ))}
                </div>
              </F>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rpub" checked={form.isPublished} onChange={e => setForm((f) => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                <label htmlFor="rpub" className="text-sm font-semibold text-slate-700">Published</label>
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
            <h3 className="font-black text-slate-900 mb-2">Delete Resource?</h3>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
