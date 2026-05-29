import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { contestApi } from "@/lib/api";
import {
  Trophy, Clock, Users, Calendar, ChevronRight, Loader2,
  Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle,
} from "lucide-react";

type ContestStatus = "upcoming" | "ongoing" | "ended";
type ContestType = "weekly" | "monthly" | "custom";

interface Contest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  type: ContestType;
  problemCount: number;
  totalRegistrations: number;
  banner: string;
  isPublished: boolean;
  isStarted: boolean;
}

const TYPE_BADGE: Record<ContestType, { label: string; cls: string } | null> = {
  weekly:  { label: "Weekly",  cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  monthly: { label: "Monthly", cls: "bg-violet-50 text-violet-700 border border-violet-200" },
  custom:  null,
};

const STATUS_CFG: Record<ContestStatus, { label: string; cls: string; dot: string }> = {
  upcoming: { label: "Upcoming",  cls: "bg-blue-50 text-blue-700 border border-blue-200",   dot: "bg-blue-500" },
  ongoing:  { label: "Live Now",  cls: "bg-green-50 text-green-700 border border-green-200", dot: "bg-green-500 animate-pulse" },
  ended:    { label: "Ended",     cls: "bg-slate-100 text-slate-500 border border-slate-200", dot: "bg-slate-400" },
};

const BANNER_OPTIONS = [
  { label: "Blue–Indigo",   value: "from-blue-600 to-indigo-700" },
  { label: "Violet–Purple", value: "from-violet-600 to-purple-700" },
  { label: "Emerald–Teal",  value: "from-emerald-600 to-teal-700" },
  { label: "Orange–Red",    value: "from-orange-500 to-red-600" },
  { label: "Pink–Rose",     value: "from-pink-500 to-rose-600" },
  { label: "Cyan–Blue",     value: "from-cyan-500 to-blue-600" },
];

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function duration(s: string, e: string) {
  const m = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
}

function Countdown({ target, prefix }: { target: string; prefix: string }) {
  const [rem, setRem] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date(target).getTime() - Date.now();
      if (d <= 0) { setRem(""); return; }
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setRem(`${h > 0 ? `${h}h ` : ""}${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!rem) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
      <Clock className="w-3 h-3" />
      {prefix} {rem}
    </span>
  );
}

const BLANK_FORM = { title: "", description: "", startTime: "", endTime: "", banner: BANNER_OPTIONS[0].value, type: "custom" as ContestType, isPublished: false };

const CONTEST_TYPE_OPTIONS = [
  { value: "custom",  label: "Custom" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

function AdminModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: typeof BLANK_FORM & { _id?: string };
  onSave: (data: typeof BLANK_FORM) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const toLocal = (iso: string) => iso ? iso.slice(0, 16) : "";
  const fromLocal = (local: string) => local ? new Date(local).toISOString() : "";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-slate-900">{form._id ? "Edit Contest" : "Create Contest"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                value={toLocal(form.startTime)}
                onChange={(e) => set("startTime", fromLocal(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="datetime-local"
                value={toLocal(form.endTime)}
                onChange={(e) => set("endTime", fromLocal(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contest Type</label>
            <div className="flex gap-2">
              {CONTEST_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("type", opt.value)}
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
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Banner Color</label>
            <div className="flex gap-2 flex-wrap">
              {BANNER_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => set("banner", b.value)}
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${b.value} ring-2 ring-offset-2 transition-all ${form.banner === b.value ? "ring-primary scale-110" : "ring-transparent"}`}
                  title={b.label}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-semibold text-slate-700">Publish (visible to users)</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.title || !form.startTime || !form.endTime}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {form._id ? "Save Changes" : "Create Contest"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | ContestStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ContestType>("all");
  const [modal, setModal] = useState<(typeof BLANK_FORM & { _id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isAdmin = JSON.parse(localStorage.getItem("user") || "{}").role === "admin";

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    contestApi.getAll().then((data) => setContests(data as Contest[])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = contests
    .filter((c) => tab === "all" || c.status === tab)
    .filter((c) => typeFilter === "all" || c.type === typeFilter);

  const handleSave = async (form: typeof BLANK_FORM & { _id?: string }) => {
    setSaving(true);
    try {
      if (form._id) {
        const updated = await contestApi.update(form._id, form);
        setContests((p) => p.map((c) => (c._id === form._id ? { ...c, ...(updated as Contest) } : c)));
        showToast("Contest updated");
      } else {
        const created = await contestApi.create(form);
        setContests((p) => [created as Contest, ...p]);
        showToast("Contest created");
      }
      setModal(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contest?")) return;
    try {
      await contestApi.delete(id);
      setContests((p) => p.filter((c) => c._id !== id));
      showToast("Contest deleted");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete", false);
    }
  };

  const TABS: { key: "all" | ContestStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ongoing", label: "Live" },
    { key: "upcoming", label: "Upcoming" },
    { key: "ended", label: "Past" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white pt-16 pb-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Competitive Programming
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Contests</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Solve DSA problems, earn points, and climb the leaderboard in live coding contests.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters + admin button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col gap-2">
            {/* Status tabs */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? "bg-primary text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {label}
                  {key !== "all" && (
                    <span className="ml-1.5 text-xs opacity-75">
                      ({contests.filter((c) => c.status === key).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              {(["all", "weekly", "monthly", "custom"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                    typeFilter === t
                      ? t === "weekly"
                        ? "bg-blue-600 text-white border-blue-600"
                        : t === "monthly"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-700 text-white border-slate-700"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                  {t !== "all" && (
                    <span className="ml-1 opacity-75">
                      ({contests.filter((c) => c.type === t).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setModal({ ...BLANK_FORM })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Contest
            </button>
          )}
        </div>

        {/* Contest list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No contests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((contest) => {
              const st = !contest.isStarted
                ? { label: "Not Started", cls: "bg-slate-100 text-slate-500 border border-slate-200", dot: "bg-slate-400" }
                : STATUS_CFG[contest.status];
              return (
                <div key={contest._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Banner strip */}
                  <div className={`h-2 bg-gradient-to-r ${contest.banner}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                          {TYPE_BADGE[contest.type ?? "custom"] && (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_BADGE[contest.type]!.cls}`}>
                              {TYPE_BADGE[contest.type]!.label}
                            </span>
                          )}
                          {!contest.isPublished && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                              Draft
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-1 group-hover:text-primary transition-colors">
                          {contest.title}
                        </h2>
                        {contest.description && (
                          <p className="text-slate-500 text-sm mb-3 line-clamp-2">{contest.description}</p>
                        )}
                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmt(contest.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration(contest.startTime, contest.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {contest.problemCount} problem{contest.problemCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {contest.totalRegistrations} registered
                          </span>
                          {contest.isStarted && contest.status === "ongoing" && (
                            <Countdown target={contest.endTime} prefix="Ends in" />
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setModal({ ...BLANK_FORM, ...contest })}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(contest._id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <Link
                          to={`/contests/${contest.slug}`}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            contest.isStarted && contest.status === "ongoing"
                              ? "bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-500/30"
                              : "bg-primary hover:bg-primary/90 text-white shadow"
                          }`}
                        >
                          {contest.isStarted && contest.status === "ongoing" ? "Enter" : "View"}
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <AdminModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />
      )}
      <Footer />
    </div>
  );
}
