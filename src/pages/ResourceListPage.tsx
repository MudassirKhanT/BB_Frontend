import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Plus, Clock, BookOpen, Code2, FileText,
  PenLine, ChevronRight, X, Loader2, AlertCircle, Eye, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { resourceApi } from "@/lib/api";
import type { ResourceDifficulty } from "@/types/models";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Resource {
  _id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  coverColor: string;
  tags: string[];
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  readTime: number;
  authorName: string;
  views: number;
  likes: number;
  company: string;
  fileUrl: string;
  videoUrl: string;
  content?: string;
  isPublished: boolean;
  createdAt: string;
}

// ─── Type Config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  apiType: string; label: string; description: string;
  icon: React.ElementType; color: string; accentColor: string;
  difficultyLabel: string;
}> = {
  "dsa-notes": {
    apiType: "dsa-note",
    label: "DSA Notes",
    description: "Data structures & algorithms notes curated for placement exams.",
    icon: Code2,
    color: "from-blue-600 to-blue-700",
    accentColor: "blue",
    difficultyLabel: "Difficulty",
  },
  "company-papers": {
    apiType: "company-paper",
    label: "Company Papers",
    description: "Past placement papers and online assessment patterns.",
    icon: FileText,
    color: "from-orange-500 to-amber-600",
    accentColor: "orange",
    difficultyLabel: "Level",
  },
  "cs-fundamentals": {
    apiType: "cs-fundamental",
    label: "CS Fundamentals",
    description: "Core CS theory — OS, DBMS, Networks, OOP for technical interviews.",
    icon: BookOpen,
    color: "from-green-600 to-emerald-700",
    accentColor: "green",
    difficultyLabel: "Difficulty",
  },
  "blog": {
    apiType: "blog",
    label: "Blog",
    description: "Career tips, prep strategies, and engineering insights.",
    icon: PenLine,
    color: "from-pink-500 to-rose-600",
    accentColor: "pink",
    difficultyLabel: "Level",
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "bg-green-50 text-green-700 border-green-200",
  Intermediate: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Advanced: "bg-red-50 text-red-700 border-red-200",
};

// ─── Admin Form ───────────────────────────────────────────────────────────────
interface AdminFormProps {
  typeConfig: typeof TYPE_CONFIG[string];
  apiType: string;
  existing?: Resource | null;
  onSave: (r: Resource) => void;
  onClose: () => void;
}

function AdminResourceForm({ typeConfig, apiType, existing, onSave, onClose }: AdminFormProps) {
  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    content: existing?.content || "",
    category: existing?.category || "",
    difficulty: existing?.difficulty || "Beginner",
    tags: existing?.tags?.join(", ") || "",
    readTime: existing?.readTime || 5,
    company: existing?.company || "",
    fileUrl: existing?.fileUrl || "",
    videoUrl: existing?.videoUrl || "",
    coverColor: existing?.coverColor || "from-blue-500 to-blue-700",
    isPublished: existing?.isPublished !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        type: apiType,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime: Number(form.readTime),
      };
      let saved: Resource;
      if (existing) {
        saved = await resourceApi.update(existing._id, payload);
      } else {
        saved = await resourceApi.create(payload);
      }
      onSave(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-lg">
            {existing ? "Edit Resource" : `Add ${typeConfig.label}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls} placeholder="e.g. Arrays — Complete Guide" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputCls} placeholder="e.g. Arrays, OS, Databases" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as ResourceDifficulty })}
                className={inputCls}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            {apiType === "company-paper" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className={inputCls} placeholder="e.g. TCS, Infosys" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Read Time (min)</label>
              <input type="number" min={1} value={form.readTime} onChange={(e) => setForm({ ...form, readTime: Number(e.target.value) })}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} resize-none`} placeholder="Short description shown on the card" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className={inputCls} placeholder="Arrays, Two Pointer, LeetCode" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cover Gradient</label>
              <input value={form.coverColor} onChange={(e) => setForm({ ...form, coverColor: e.target.value })}
                className={inputCls} placeholder="from-blue-500 to-blue-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">File URL (PDF)</label>
              <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                className={inputCls} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Video URL</label>
              <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className={inputCls} placeholder="https://youtube.com/..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Content (Markdown)</label>
              <textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                className={`${inputCls} resize-y font-mono text-xs`} placeholder="# Title&#10;&#10;## Section&#10;&#10;Write your content in markdown..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pub" checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded" />
              <label htmlFor="pub" className="text-sm font-medium text-slate-700">Published</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (existing ? "Save Changes" : "Create Resource")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Resource Card (horizontal) ────────────────────────────────────────────────
function ResourceCard({
  resource, typeSlug, isAdmin, onEdit, onDelete,
}: {
  resource: Resource; typeSlug: string; isAdmin: boolean;
  onEdit: (r: Resource) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group flex items-center gap-0 overflow-hidden">
      {/* Left accent bar */}
      <div className={`w-1 self-stretch flex-shrink-0 bg-gradient-to-b ${resource.coverColor || "from-blue-500 to-blue-700"}`} />

      {/* Icon */}
      <div className={`mx-4 my-3 w-10 h-10 rounded-xl bg-gradient-to-br ${resource.coverColor || "from-blue-500 to-blue-700"} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <FileText className="w-5 h-5 text-white" />
      </div>

      {/* Main text */}
      <div className="flex-1 min-w-0 py-3 pr-2">
        {resource.category && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{resource.category}</p>
        )}
        <Link to={`/resources/${typeSlug}/${resource.slug}`}
          className="font-bold text-slate-900 text-sm leading-snug hover:text-blue-600 transition-colors line-clamp-1 block">
          {resource.title}
        </Link>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-1 mt-0.5">
          {resource.description}
        </p>
        {resource.tags.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-3 px-4 flex-shrink-0 text-xs text-slate-400">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{resource.readTime} min</span>
        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{resource.views}</span>
        <Badge className={`text-[10px] border ${DIFFICULTY_COLORS[resource.difficulty]}`}>
          {resource.difficulty}
        </Badge>
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-1 px-2 flex-shrink-0">
          <button onClick={() => onEdit(resource)}
            className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(resource._id)}
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Arrow */}
      <Link to={`/resources/${typeSlug}/${resource.slug}`}
        className="flex items-center text-slate-300 hover:text-blue-600 pr-4 pl-1 transition-colors flex-shrink-0 group-hover:text-blue-500">
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResourceListPage() {
  const { type: typeSlug = "" } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const config = TYPE_CONFIG[typeSlug];

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);

  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role === "admin"; }
    catch { return false; }
  })();

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    resourceApi.getAll({ type: config.apiType })
      .then((data: Resource[]) => setResources(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [typeSlug]);

  if (!config) {
    navigate("/resources");
    return null;
  }

  const Icon = config.icon;
  const categories = [...new Set(resources.map((r) => r.category).filter(Boolean))];

  const filtered = resources.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = filterDiff === "all" || r.difficulty === filterDiff;
    const matchCat = filterCat === "all" || r.category === filterCat;
    return matchSearch && matchDiff && matchCat;
  });

  const grouped: Record<string, Resource[]> = {};
  filtered.forEach((r) => {
    const key = r.category || "General";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await resourceApi.delete(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSave = (saved: Resource) => {
    setResources((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Admin Form Modal */}
      {(showForm || editTarget) && (
        <AdminResourceForm
          typeConfig={config}
          apiType={config.apiType}
          existing={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* Header Banner */}
      <div className={`bg-gradient-to-br ${config.color} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={() => navigate("/resources")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Resources
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{config.label}</h1>
              <p className="text-white/80 mt-1">{config.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-1 shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${config.label.toLowerCase()}...`}
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400" />
            {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
          </div>

          <select value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="all">All Levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          {categories.length > 0 && (
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Topics</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}

          {isAdmin && (
            <Button onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm flex-shrink-0">
              <Plus className="w-4 h-4" /> Add Resource
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 h-16 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-slate-700 font-semibold mb-1">Failed to load resources</p>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-slate-600 font-semibold text-lg mb-1">No resources found</p>
            <p className="text-slate-400 text-sm">
              {search ? "Try a different search term" : "Check back soon — content is being added regularly."}
            </p>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Add first resource
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-black text-slate-900">{category}</h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((r) => (
                    <ResourceCard key={r._id} resource={r} typeSlug={typeSlug}
                      isAdmin={isAdmin}
                      onEdit={(r) => setEditTarget(r)}
                      onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
