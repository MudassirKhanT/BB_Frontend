import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MessageSquare, Filter, ChevronDown, ChevronUp,
  Building2, Calendar, User, CheckCircle2, XCircle, Clock,
  Plus, X, Loader2, AlertCircle, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { interviewExpApi, companyApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Company {
  _id: string;
  name: string;
  slug: string;
  type: string;
  color: string;
  badge: string;
}

interface Experience {
  _id: string;
  company: Company;
  authorName: string;
  role: string;
  year: number;
  experience: string;
  result: "selected" | "rejected" | "pending";
  rounds: string[];
  tips: string;
  isApproved: boolean;
  createdAt: string;
}

const RESULT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  selected: { label: "Selected",  color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected",  color: "bg-red-50   text-red-600   border-red-200",   icon: XCircle },
  pending:  { label: "Pending",   color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
};

// ─── Submit Experience Form ────────────────────────────────────────────────────
function SubmitForm({ companies, onClose, onSubmit }: {
  companies: Company[];
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [companySlug, setCompanySlug] = useState("");
  const [form, setForm] = useState({ role: "", year: new Date().getFullYear(), experience: "", result: "pending", tips: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySlug) { setError("Please select a company"); return; }
    setSaving(true); setError("");
    try {
      await interviewExpApi.submit(companySlug, form);
      setSuccess(true);
      setTimeout(() => { onSubmit(); onClose(); }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            <h3 className="font-black text-slate-900 text-lg">Share Your Experience</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-2">Submitted!</h3>
            <p className="text-slate-500 text-sm">Your experience has been submitted for review. It will appear after admin approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company *</label>
              <select required value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} className={inputCls}>
                <option value="">Select company...</option>
                {companies.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role / Position *</label>
                <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputCls} placeholder="e.g. Software Engineer" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Year *</label>
                <input type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className={inputCls} min={2015} max={2030} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Result</label>
              <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className={inputCls}>
                <option value="pending">Waiting for result</option>
                <option value="selected">Selected ✓</option>
                <option value="rejected">Rejected ✗</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Interview Experience *</label>
              <textarea required rows={5} value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className={`${inputCls} resize-none`}
                placeholder="Describe the interview rounds, types of questions asked, difficulty level, process, etc." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tips for Others</label>
              <textarea rows={3} value={form.tips}
                onChange={(e) => setForm({ ...form, tips: e.target.value })}
                className={`${inputCls} resize-none`}
                placeholder="What would you advise future candidates preparing for this company?" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Experience Card ───────────────────────────────────────────────────────────
function ExperienceCard({ exp, isAdmin, onDelete }: {
  exp: Experience; isAdmin: boolean; onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const resultInfo = RESULT_CONFIG[exp.result] || RESULT_CONFIG.pending;
  const ResultIcon = resultInfo.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/company-prep/${exp.company?.slug}`}
                  className="font-black text-slate-900 hover:text-violet-600 transition-colors">
                  {exp.company?.name || "Company"}
                </Link>
                {exp.company?.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {exp.company.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{exp.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs border ${resultInfo.color} gap-1`}>
              <ResultIcon className="w-3 h-3" />{resultInfo.label}
            </Badge>
            {isAdmin && (
              <button onClick={() => onDelete(exp._id)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{exp.authorName}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{exp.year}</span>
        </div>

        {/* Experience text */}
        <p className={`text-slate-600 text-sm leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
          {exp.experience}
        </p>

        {exp.experience.length > 200 && (
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-violet-600 text-xs font-bold mt-2 hover:underline">
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Show less</> : <><ChevronDown className="w-3.5 h-3.5" />Read more</>}
          </button>
        )}

        {/* Tips */}
        {expanded && exp.tips && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-700 mb-1">💡 Tips from this candidate</p>
            <p className="text-sm text-amber-800 leading-relaxed">{exp.tips}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InterviewExperiencesPage() {
  const navigate = useNavigate();

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const isLoggedIn = !!localStorage.getItem("token");
  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role === "admin"; }
    catch { return false; }
  })();

  const load = (pg = 1) => {
    setLoading(true);
    const params: { page: number; limit: number; result?: string } = { page: pg, limit: 15 };
    if (filterResult !== "all") params.result = filterResult;
    interviewExpApi.getAll(params)
      .then((data) => {
        const d = data as { experiences: Experience[]; pages: number };
        setExperiences(d.experiences || []);
        setTotalPages(d.pages || 1);
        setPage(pg);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [filterResult]);

  useEffect(() => {
    companyApi.getAll().then((data: Company[]) => setCompanies(data)).catch(() => {});
  }, []);

  const displayed = filterCompany === "all"
    ? experiences
    : experiences.filter((e) => e.company?.slug === filterCompany);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience?")) return;
    try {
      await interviewExpApi.delete(id);
      setExperiences((prev) => prev.filter((e) => e._id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {showForm && (
        <SubmitForm
          companies={companies}
          onClose={() => setShowForm(false)}
          onSubmit={() => load(1)}
        />
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={() => navigate("/resources")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Resources
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">Interview Experiences</h1>
                <p className="text-white/80 mt-1">Real stories from students placed at top companies</p>
              </div>
            </div>
            {isLoggedIn && (
              <Button onClick={() => setShowForm(true)}
                className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> Share Your Experience
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filter</span>
          </div>
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
            <option value="all">All Results</option>
            <option value="selected">✓ Selected</option>
            <option value="rejected">✗ Rejected</option>
            <option value="pending">⏳ Pending</option>
          </select>
          {companies.length > 0 && (
            <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
              <option value="all">All Companies</option>
              {companies.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
            </select>
          )}
          {!isLoggedIn && (
            <div className="ml-auto">
              <Link to="/login" className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors">
                <Plus className="w-4 h-4" /> Share Experience
              </Link>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-slate-700 font-semibold">{error}</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-slate-600 font-semibold text-lg mb-1">No experiences yet</p>
            <p className="text-slate-400 text-sm mb-5">Be the first to share your interview journey!</p>
            {isLoggedIn ? (
              <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Share Experience
              </Button>
            ) : (
              <Link to="/login">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">Log in to share</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              {displayed.map((exp) => (
                <ExperienceCard key={exp._id} exp={exp} isAdmin={isAdmin} onDelete={handleDelete} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
                <span className="text-sm text-slate-600 font-semibold">Page {page} of {totalPages}</span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
