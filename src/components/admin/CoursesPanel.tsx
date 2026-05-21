import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, BookOpen,
  ChevronRight, ArrowLeft, GripVertical, FileText, Video, Code2,
  AlertCircle, CheckCircle2, Info, List, Minus,
} from "lucide-react";
import { courseApi } from "../../lib/api";
import type { Course, Topic, Subtopic, ContentBlock } from "@/types/models";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const COLORS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700", "from-cyan-500 to-cyan-700",
  "from-purple-500 to-purple-700", "from-orange-500 to-orange-700",
];

const COURSE_BLANK = {
  title: "", slug: "", description: "", shortDescription: "", level: "Beginner",
  category: "Programming", tags: "", coverImageUrl: "", estimatedDuration: "",
  price: 0, color: COLORS[0], whatYouWillLearn: "", requirements: "",
};

const BLOCK_TYPES = [
  "heading", "paragraph", "code", "info", "tip", "warning", "success",
  "keyPoints", "list", "divider", "table",
] as const;

type BlockType = typeof BLOCK_TYPES[number];

interface SubtopicForm {
  title: string;
  slug: string;
  order: number;
  estimatedReadTime: number;
  isFreePreview: boolean;
  videoUrl: string;
  summary: string;
  content: ContentBlock[];
}

function emptyBlock(type: BlockType): ContentBlock {
  switch (type) {
    case "heading":   return { type, data: { level: 2, text: "" } };
    case "paragraph": return { type, data: { text: "" } };
    case "code":      return { type, data: { language: "javascript", title: "", code: "" } };
    case "info":
    case "tip":
    case "warning":
    case "success":   return { type, data: { title: "", text: "" } };
    case "keyPoints": return { type, data: { title: "", points: [""] } };
    case "list":      return { type, data: { style: "unordered", items: [""] } };
    case "divider":   return { type, data: {} };
    case "table":     return { type, data: { headers: ["Col1", "Col2"], rows: [["", ""]] } };
    default:          return { type, data: {} };
  }
}

const BLOCK_ICON: Record<string, React.ElementType> = {
  heading: Minus, paragraph: FileText, code: Code2,
  info: Info, tip: CheckCircle2, warning: AlertCircle, success: CheckCircle2,
  keyPoints: List, list: List, divider: Minus, table: GripVertical,
};

const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>{children}</div>
);

// ─── Block Editor ──────────────────────────────────────────────────────────────
function BlockEditor({ block, onChange, onRemove }: { block: ContentBlock; onChange: (b: ContentBlock) => void; onRemove: () => void }) {
  const d = block.data || {};
  const set = (partial: object) => onChange({ ...block, data: { ...d, ...partial } });

  return (
    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-300" />
          <select
            value={block.type}
            onChange={e => onChange(emptyBlock(e.target.value as BlockType))}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
          >
            {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button type="button" onClick={onRemove} className="p-1 rounded text-slate-400 hover:text-red-500">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {block.type === "heading" && (
        <div className="grid grid-cols-4 gap-2">
          <select value={(d.level as number) || 2} onChange={e => set({ level: Number(e.target.value) })}
            className={inp + " col-span-1"}>
            {[1,2,3,4].map(l => <option key={l} value={l}>H{l}</option>)}
          </select>
          <input value={(d.text as string) || ""} onChange={e => set({ text: e.target.value })}
            placeholder="Heading text" className={inp + " col-span-3"} />
        </div>
      )}
      {block.type === "paragraph" && (
        <textarea value={(d.text as string) || ""} onChange={e => set({ text: e.target.value })}
          placeholder="Paragraph text…" rows={3} className={inp} />
      )}
      {block.type === "code" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={(d.language as string) || ""} onChange={e => set({ language: e.target.value })}
              placeholder="Language (e.g. javascript)" className={inp} />
            <input value={(d.title as string) || ""} onChange={e => set({ title: e.target.value })}
              placeholder="Code block title" className={inp} />
          </div>
          <textarea value={(d.code as string) || ""} onChange={e => set({ code: e.target.value })}
            placeholder="// paste code here" rows={6} className={inp + " font-mono text-xs"} />
        </div>
      )}
      {["info","tip","warning","success"].includes(block.type) && (
        <div className="space-y-2">
          <input value={(d.title as string) || ""} onChange={e => set({ title: e.target.value })}
            placeholder="Title (optional)" className={inp} />
          <textarea value={(d.text as string) || ""} onChange={e => set({ text: e.target.value })}
            placeholder="Content text…" rows={2} className={inp} />
        </div>
      )}
      {block.type === "keyPoints" && (
        <div className="space-y-2">
          <input value={(d.title as string) || ""} onChange={e => set({ title: e.target.value })}
            placeholder="Section title (optional)" className={inp} />
          {((d.points as string[]) || [""]).map((p: string, i: number) => (
            <div key={i} className="flex gap-2">
              <input value={p} onChange={e => { const pts = [...((d.points as string[]) || [])]; pts[i] = e.target.value; set({ points: pts }); }}
                placeholder={`Point ${i + 1}`} className={inp} />
              <button type="button" onClick={() => { const pts = ((d.points as string[]) || []).filter((_, j: number) => j !== i); set({ points: pts.length ? pts : [""] }); }}
                className="p-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ points: [...((d.points as string[]) || []), ""] })}
            className="text-xs font-semibold text-primary hover:underline">+ Add point</button>
        </div>
      )}
      {block.type === "list" && (
        <div className="space-y-2">
          <select value={(d.style as string) || "unordered"} onChange={e => set({ style: e.target.value })}
            className={inp}><option value="unordered">Unordered</option><option value="ordered">Ordered</option></select>
          {((d.items as string[]) || [""]).map((item: string, i: number) => (
            <div key={i} className="flex gap-2">
              <input value={item} onChange={e => { const it = [...((d.items as string[]) || [])]; it[i] = e.target.value; set({ items: it }); }}
                placeholder={`Item ${i + 1}`} className={inp} />
              <button type="button" onClick={() => { const it = ((d.items as string[]) || []).filter((_, j: number) => j !== i); set({ items: it.length ? it : [""] }); }}
                className="p-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ items: [...((d.items as string[]) || []), ""] })}
            className="text-xs font-semibold text-primary hover:underline">+ Add item</button>
        </div>
      )}
      {block.type === "table" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {((d.headers as string[]) || ["Col1"]).map((h: string, i: number) => (
              <input key={i} value={h} onChange={e => { const hd = [...((d.headers as string[]) || [])]; hd[i] = e.target.value; set({ headers: hd }); }}
                placeholder={`Header ${i+1}`} className={inp} />
            ))}
            <button type="button" onClick={() => { set({ headers: [...((d.headers as string[])||[]),"NewCol"], rows: ((d.rows as string[][])||[]).map((r:string[]) => [...r,""]) }); }}
              className="px-2 text-xs text-primary font-semibold whitespace-nowrap">+ Col</button>
          </div>
          {((d.rows as string[][]) || [[""]]).map((row: string[], ri: number) => (
            <div key={ri} className="flex gap-2">
              {row.map((cell: string, ci: number) => (
                <input key={ci} value={cell} onChange={e => { const rows = (d.rows as string[][]).map((r:string[],rj:number) => rj===ri ? r.map((c:string,cj:number) => cj===ci ? e.target.value : c) : r); set({ rows }); }}
                  placeholder={`R${ri+1}C${ci+1}`} className={inp} />
              ))}
              <button type="button" onClick={() => set({ rows: ((d.rows as string[][])||[]).filter((_,j:number)=>j!==ri) })}
                className="p-1 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ rows: [...((d.rows as string[][])||[]), new Array(((d.headers as string[])||[]).length).fill("")] })}
            className="text-xs font-semibold text-primary hover:underline">+ Add row</button>
        </div>
      )}
      {block.type === "divider" && (
        <p className="text-xs text-slate-400 italic">— horizontal divider —</p>
      )}
    </div>
  );
}

// ─── Subtopic Editor ───────────────────────────────────────────────────────────
function SubtopicEditor({ topicId, subtopic, onSaved, onCancel }: {
  topicId: string; subtopic: Subtopic | null; onSaved: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<SubtopicForm>({
    title: "", slug: "", order: 0, isFreePreview: false,
    videoUrl: "", summary: "", content: [],
    estimatedReadTime: 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (subtopic) {
      setLoadingContent(true);
      courseApi.getSubtopicById(subtopic._id).then((d: Subtopic) => {
        setForm({
          title: d.title || "",
          slug: d.slug || "",
          order: d.order ?? 0,
          isFreePreview: d.isFreePreview ?? false,
          videoUrl: d.videoUrl || "",
          summary: d.summary || "",
          content: Array.isArray(d.content) ? d.content : [],
          estimatedReadTime: d.estimatedReadTime ?? 5,
        });
        setLoadingContent(false);
      }).catch(() => setLoadingContent(false));
    } else {
      setForm({ title: "", slug: "", order: 0, isFreePreview: false, videoUrl: "", summary: "", content: [], estimatedReadTime: 5 });
    }
  }, [subtopic]);

  const addBlock = (type: BlockType) => setForm(f => ({ ...f, content: [...f.content, emptyBlock(type)] }));
  const updateBlock = (i: number, b: ContentBlock) => setForm(f => ({ ...f, content: f.content.map((c, j) => j === i ? b : c) }));
  const removeBlock = (i: number) => setForm(f => ({ ...f, content: f.content.filter((_, j) => j !== i) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const payload = { ...form, topic: topicId };
    try {
      if (subtopic) await courseApi.updateSubtopic(subtopic._id, payload);
      else await courseApi.createSubtopic(payload);
      onSaved();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setSaving(false); }
  };

  if (loadingContent) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading content…
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-black text-lg text-slate-900">{subtopic ? "Edit Subtopic" : "New Subtopic"}</h3>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <F label="Title *">
            <input className={inp} value={form.title} required
              onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: subtopic ? f.slug : toSlug(e.target.value) }))} />
          </F>
          <F label="Slug *">
            <input className={inp} value={form.slug} required onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </F>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <F label="Order">
            <input type="number" className={inp} value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
          </F>
          <F label="Read Time (min)">
            <input type="number" className={inp} value={form.estimatedReadTime} min={1}
              onChange={e => setForm(f => ({ ...f, estimatedReadTime: Number(e.target.value) }))} />
          </F>
          <div className="flex items-end pb-2 gap-2">
            <input type="checkbox" id="fp" checked={form.isFreePreview}
              onChange={e => setForm(f => ({ ...f, isFreePreview: e.target.checked }))} className="rounded" />
            <label htmlFor="fp" className="text-sm font-semibold text-slate-700">Free Preview</label>
          </div>
        </div>
        <F label="Video URL">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input className={inp} value={form.videoUrl} placeholder="https://youtube.com/..." onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
          </div>
        </F>
        <F label="Summary">
          <textarea className={inp} rows={2} value={form.summary} placeholder="Brief summary of this lesson…"
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
        </F>
      </div>

      {/* Content Blocks */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900">Content Blocks ({form.content.length})</h4>
        </div>

        {form.content.length === 0 && (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No content blocks yet</p>
            <p className="text-xs">Add blocks below to build your lesson</p>
          </div>
        )}

        <div className="space-y-2">
          {form.content.map((block, i) => (
            <BlockEditor key={i} block={block}
              onChange={(b) => updateBlock(i, b)}
              onRemove={() => removeBlock(i)} />
          ))}
        </div>

        {/* Add block buttons */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">Add Block:</p>
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map(type => {
              const Icon = BLOCK_ICON[type] || Plus;
              return (
                <button key={type} type="button" onClick={() => addBlock(type)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors">
                  <Icon className="w-3 h-3" /> {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
    </form>
  );
}

// ─── Subtopics List ────────────────────────────────────────────────────────────
function SubtopicsView({ topic, onBack }: { topic: Topic; onBack: () => void }) {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Subtopic | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    courseApi.getSubtopics(topic._id).then((d: Subtopic[]) => {
      setSubtopics(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [topic._id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await courseApi.deleteSubtopic(deleteId); setDeleteId(null); load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  if (editing !== undefined) {
    return (
      <SubtopicEditor topicId={topic._id} subtopic={editing}
        onSaved={() => { setEditing(undefined); load(); }}
        onCancel={() => setEditing(undefined)} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400 font-semibold">Topic</p>
          <h3 className="font-black text-lg text-slate-900">{topic.title}</h3>
        </div>
        <button onClick={() => setEditing(null)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Subtopic
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : subtopics.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-semibold">No lessons yet</p>
            <p className="text-sm">Add subtopics to this topic</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Order","Title","Read Time","Free Preview","Content Blocks","Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subtopics.map(st => (
                <tr key={st._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-semibold">{st.order}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{st.title}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{st.estimatedReadTime ?? "—"}m</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${st.isFreePreview ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {st.isFreePreview ? "Free" : "Locked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(st.content || []).length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setEditing(st)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(st._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Subtopic?</h3>
            <p className="text-sm text-slate-500 mb-5">All lesson content will be permanently removed.</p>
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

// ─── Topics View ───────────────────────────────────────────────────────────────
function TopicsView({ course, onBack }: { course: Course; onBack: () => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShow] = useState(false);
  const [editItem, setEdit] = useState<Topic | null>(null);
  const [form, setForm] = useState({ title: "", order: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    courseApi.getTopics(course.slug).then((d: Topic[]) => {
      setTopics(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [course.slug]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEdit(null); setForm({ title: "", order: topics.length }); setShow(true); };
  const openEdit = (t: Topic) => { setEdit(t); setForm({ title: t.title, order: t.order }); setShow(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await courseApi.updateTopic(editItem._id, form);
      else await courseApi.createTopic({ ...form, course: course._id });
      setShow(false); load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await courseApi.deleteTopic(deleteId); setDeleteId(null); load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  if (activeTopic) return <SubtopicsView topic={activeTopic} onBack={() => setActiveTopic(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400 font-semibold">Course Curriculum</p>
          <h3 className="font-black text-lg text-slate-900">{course.title}</h3>
        </div>
        <button onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Topic
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <BookOpen className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-semibold">No topics yet</p>
            <p className="text-sm">Create topics to organize this course</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Order","Topic","Subtopics","Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topics.map(t => (
                <tr key={t._id} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 text-slate-500 font-semibold">{t.order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setActiveTopic(t)} className="flex items-center gap-2 font-bold text-slate-900 hover:text-primary transition-colors">
                      {t.title} <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">—</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(t._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">{editItem ? "Edit Topic" : "New Topic"}</h3>
              <button onClick={() => setShow(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <F label="Topic Title *">
                <input className={inp} value={form.title} required onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </F>
              <F label="Order">
                <input type="number" className={inp} value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
              </F>
              <div className="flex gap-3 pt-2">
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
            <h3 className="font-black text-slate-900 mb-2">Delete Topic?</h3>
            <p className="text-sm text-slate-500 mb-5">All subtopics and content inside will be deleted.</p>
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

// ─── Main CoursesPanel ─────────────────────────────────────────────────────────
export default function CoursesPanel() {
  const [items, setItems]       = useState<Course[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShow]    = useState(false);
  const [editItem, setEdit]     = useState<Course | null>(null);
  const [form, setForm]         = useState({ ...COURSE_BLANK });
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const load = () => courseApi.getAllAdmin().then((d: { courses?: Course[] } | Course[]) => { setItems(Array.isArray(d) ? d : (d as { courses?: Course[] }).courses ?? []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEdit(null); setForm({ ...COURSE_BLANK }); setError(""); setShow(true); };
  const openEdit   = (item: Course) => {
    setEdit(item);
    setForm({
      title: item.title, slug: item.slug, description: item.description,
      shortDescription: item.shortDescription || "", level: item.level || "Beginner",
      category: item.category || "Programming", tags: (item.tags || []).join(", "),
      coverImageUrl: item.coverImageUrl || "", estimatedDuration: item.estimatedDuration || "",
      price: item.price || 0, color: item.color || COLORS[0],
      whatYouWillLearn: (item.whatYouWillLearn || []).join("\n"),
      requirements: (item.requirements || []).join("\n"),
    });
    setError(""); setShow(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      whatYouWillLearn: form.whatYouWillLearn.split("\n").map((s: string) => s.trim()).filter(Boolean),
      requirements: form.requirements.split("\n").map((s: string) => s.trim()).filter(Boolean),
    };
    try {
      if (editItem) await courseApi.update(editItem._id, payload);
      else await courseApi.create(payload);
      setShow(false); await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "An error occurred"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await courseApi.delete(deleteId); setDeleteId(null); await load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  const togglePublish = async (item: Course) => {
    try {
      if (item.isPublished) await courseApi.update(item._id, { isPublished: false });
      else await courseApi.publish(item._id);
      await load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  if (activeCourse) return <TopicsView course={activeCourse} onBack={() => setActiveCourse(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-semibold">{items.length} course{items.length !== 1 ? "s" : ""}</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><BookOpen className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No courses yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Title","Level","Category","Enrollments","Status","Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h==="Actions"?"text-right":"text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color || COLORS[0]} flex items-center justify-center flex-shrink-0`}>
                          <BookOpen className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <button onClick={() => setActiveCourse(item)} className="font-bold text-slate-900 hover:text-primary truncate max-w-[180px] flex items-center gap-1">
                            {item.title} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <p className="text-xs text-slate-400">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.level==="Beginner"?"bg-green-100 text-green-700":item.level==="Intermediate"?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"}`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.category}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.totalEnrollments ?? 0}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => togglePublish(item)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${item.isPublished?"bg-green-100 text-green-700 hover:bg-green-200":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {item.isPublished ? <><Eye className="w-3 h-3" />Published</> : <><EyeOff className="w-3 h-3" />Draft</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(item)} title="Edit course info" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
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

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">{editItem ? "Edit Course" : "New Course"}</h2>
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
              <F label="Description *">
                <textarea className={inp} rows={3} value={form.description} required onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </F>
              <F label="Short Description">
                <input className={inp} value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Level">
                  <select className={inp} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                    {["Beginner","Intermediate","Advanced"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </F>
                <F label="Category">
                  <input className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Duration (e.g. 10 hours)">
                  <input className={inp} value={form.estimatedDuration} onChange={e => setForm(f => ({ ...f, estimatedDuration: e.target.value }))} />
                </F>
                <F label="Price (₹)">
                  <input type="number" className={inp} value={form.price} min={0} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </F>
              </div>
              <F label="Tags (comma-separated)">
                <input className={inp} value={form.tags} placeholder="DSA, Arrays, Sorting" onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </F>
              <F label="Cover Image URL">
                <input className={inp} value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))} />
              </F>
              <F label="Color Theme">
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c} ${form.color===c?"ring-2 ring-offset-2 ring-slate-900":""}`} />
                  ))}
                </div>
              </F>
              <F label="What You'll Learn (one per line)">
                <textarea className={inp} rows={3} value={form.whatYouWillLearn} placeholder="Arrays & Strings&#10;Dynamic Programming" onChange={e => setForm(f => ({ ...f, whatYouWillLearn: e.target.value }))} />
              </F>
              <F label="Requirements (one per line)">
                <textarea className={inp} rows={2} value={form.requirements} placeholder="Basic programming knowledge" onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} />
              </F>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShow(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editItem ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Course?</h3>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone. All enrollments and content will be lost.</p>
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
