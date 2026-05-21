import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  ClipboardList, Clock, CheckCircle2, Loader2, Plus, Pencil,
  Trash2, X, AlertCircle, ChevronRight, Trophy, BarChart3,
  BookOpen, Lock,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Exam {
  _id: string;
  title: string;
  slug: string;
  description: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  banner: string;
  isPublished: boolean;
  tags: string[];
  myAttempt: { score: number; total: number; completedAt: string } | null;
}

const SECTION_LABELS: Record<string, string> = {
  aptitude:      "Aptitude",
  communication: "Communication",
  coding:        "Coding",
  sql:           "SQL",
};
const SECTIONS = Object.keys(SECTION_LABELS);

const BANNERS = [
  { label: "Violet–Purple", value: "from-violet-600 to-purple-700" },
  { label: "Blue–Indigo",   value: "from-blue-600 to-indigo-700" },
  { label: "Emerald–Teal",  value: "from-emerald-600 to-teal-700" },
  { label: "Orange–Red",    value: "from-orange-500 to-red-600" },
];

function pct(score: number, total: number) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

const BLANK = {
  title: "", description: "", instructions: "", duration: 60,
  banner: BANNERS[0].value, isPublished: false, passingScore: 60,
};

function AdminModal({
  initial, onSave, onClose, saving,
}: {
  initial: typeof BLANK & { _id?: string };
  onSave: (d: typeof BLANK) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const s = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-slate-900">{form._id ? "Edit Exam" : "Create Exam"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => s("title", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => s("description", e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Instructions</label>
            <textarea value={form.instructions} onChange={(e) => s("instructions", e.target.value)} rows={4}
              placeholder="• Each question carries 1 mark&#10;• No negative marking"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (min)</label>
              <input type="number" value={form.duration} onChange={(e) => s("duration", Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Passing % </label>
              <input type="number" value={form.passingScore} onChange={(e) => s("passingScore", Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Banner</label>
            <div className="flex gap-2">
              {BANNERS.map((b) => (
                <button key={b.value} type="button" onClick={() => s("banner", b.value)}
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${b.value} ring-2 ring-offset-2 transition-all ${form.banner === b.value ? "ring-primary scale-110" : "ring-transparent"}`} />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => s("isPublished", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-semibold text-slate-700">Publish (visible to users)</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.title}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {form._id ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MockAssessmentsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<(typeof BLANK & { _id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isAdmin = JSON.parse(localStorage.getItem("user") || "{}").role === "admin";
  const isLoggedIn = !!localStorage.getItem("token");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const load = () => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/mock`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then(setExams)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form: typeof BLANK & { _id?: string }) => {
    setSaving(true);
    try {
      const url = form._id ? `${API_BASE}/mock/${form._id}` : `${API_BASE}/mock`;
      const method = form._id ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      load();
      setModal(null);
      showToast(form._id ? "Exam updated" : "Exam created");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed", false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam and all its questions?")) return;
    try {
      await fetch(`${API_BASE}/mock/${id}`, { method: "DELETE", headers: headers() });
      setExams((p) => p.filter((e) => e._id !== id));
      showToast("Exam deleted");
    } catch {
      showToast("Failed to delete", false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-purple-900 text-white pt-16 pb-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <ClipboardList className="w-4 h-4 text-violet-300" />
            Placement Preparation
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Mock Assessments</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Full-length placement tests with Aptitude, Communication, Coding & SQL — exactly like the real thing.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm font-semibold text-white/70">
            {SECTIONS.map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                {SECTION_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Admin create */}
        {isAdmin && (
          <div className="flex justify-end mb-5">
            <button onClick={() => setModal({ ...BLANK })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> New Exam
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No exams available yet</p>
          </div>
        ) : (
          <div className="space-y-5">
            {exams.map((exam) => {
              const attempted = !!exam.myAttempt;
              const score = exam.myAttempt ? pct(exam.myAttempt.score, exam.myAttempt.total) : null;
              const passed = score !== null && score >= exam.passingScore;

              return (
                <div key={exam._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${exam.banner}`} />
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${exam.banner} flex items-center justify-center shrink-0 shadow-lg`}>
                        <ClipboardList className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h2 className="text-xl font-black text-slate-900">{exam.title}</h2>
                          {!exam.isPublished && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">Draft</span>
                          )}
                          {attempted && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${passed ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {passed ? "Passed" : "Failed"} · {score}%
                            </span>
                          )}
                        </div>
                        {exam.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{exam.description}</p>}

                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 font-medium mb-4">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration} min</span>
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{exam.totalQuestions} questions</span>
                          <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />Passing: {exam.passingScore}%</span>
                          <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />4 sections</span>
                        </div>

                        {/* Section pills */}
                        <div className="flex gap-2 flex-wrap mb-4">
                          {SECTIONS.map((s) => (
                            <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              {SECTION_LABELS[s]}
                            </span>
                          ))}
                        </div>

                        {/* Score bar if attempted */}
                        {attempted && exam.myAttempt && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                              <span>Your Score</span>
                              <span>{exam.myAttempt.score}/{exam.myAttempt.total}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${passed ? "bg-green-500" : "bg-red-400"}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => setModal({ ...BLANK, ...exam })}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(exam._id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {!isLoggedIn ? (
                          <Link to="/login"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                            <Lock className="w-4 h-4" /> Login to Start
                          </Link>
                        ) : attempted ? (
                          <Link to={`/mock-assessments/${exam._id}/result`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors">
                            <BarChart3 className="w-4 h-4" /> View Result
                          </Link>
                        ) : (
                          <Link to={`/mock-assessments/${exam._id}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-colors">
                            Start Exam <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <AdminModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />}
      <Footer />
    </div>
  );
}
