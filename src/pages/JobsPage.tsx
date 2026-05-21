import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search, Briefcase, Clock, ExternalLink, Bookmark,
  ChevronRight, ChevronLeft, Loader2, RefreshCw, Zap,
  Globe, Building2, Code2, Brain, BarChart3, Monitor,
  TrendingUp, ArrowRight, CheckCircle2, AlertCircle, Star, Users,
  Wifi,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

// ─── Types ────────────────────────────────────────────────────────────────────
interface JSearchJob {
  job_id:                     string;
  job_title:                  string;
  employer_name:              string;
  employer_logo:              string | null;
  job_employment_type:        string;
  job_city:                   string | null;
  job_state:                  string | null;
  job_country:                string;
  job_description:            string;
  job_min_salary:             number | null;
  job_max_salary:             number | null;
  job_salary_currency:        string | null;
  job_salary_period:          string | null;
  job_posted_at_datetime_utc: string;
  job_apply_link:             string;
  job_required_skills:        string[] | null;
  job_publisher:              string;
  job_highlights?: {
    Qualifications?:    string[];
    Responsibilities?:  string[];
    Benefits?:          string[];
  };
}

interface Job {
  id:          string;
  title:       string;
  company:     string;
  location:    string;
  type:        string;
  source:      string;
  description: string;
  salary:      string;
  postedAt:    string;
  applyUrl:    string;
  logo:        string;
  tags:        string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "";

const CATEGORIES = [
  { id: "",             label: "All Jobs",       icon: Briefcase,    color: "from-blue-500 to-cyan-500",     query: "software engineer jobs India" },
  { id: "software-dev", label: "Software Dev",   icon: Code2,        color: "from-violet-500 to-purple-600", query: "software developer programmer jobs India" },
  { id: "data",         label: "Data Science",   icon: BarChart3,    color: "from-orange-500 to-rose-500",   query: "data scientist data analyst jobs India" },
  { id: "devops",       label: "DevOps / Cloud", icon: Monitor,      color: "from-sky-500 to-blue-600",      query: "DevOps cloud engineer AWS jobs India" },
  { id: "design",       label: "UI / UX",        icon: Star,         color: "from-pink-500 to-rose-500",     query: "UI UX designer frontend jobs India" },
  { id: "marketing",    label: "Marketing",      icon: TrendingUp,   color: "from-green-500 to-emerald-500", query: "digital marketing SEO jobs India" },
  { id: "product",      label: "Product",        icon: Brain,        color: "from-amber-500 to-yellow-500",  query: "product manager product owner jobs India" },
  { id: "qa",           label: "Testing / QA",   icon: CheckCircle2, color: "from-teal-500 to-cyan-600",     query: "QA test engineer automation jobs India" },
];

const JOB_TYPE_LABELS: Record<string, string> = {
  FULLTIME:   "Full-time",
  PARTTIME:   "Part-time",
  CONTRACTOR: "Contract",
  INTERN:     "Internship",
};

// ─── JSearch fetcher ──────────────────────────────────────────────────────────
function normalise(j: JSearchJob): Job {
  const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ");

  let salary = "";
  if (j.job_min_salary && j.job_max_salary) {
    const cur    = j.job_salary_currency || "USD";
    const period = j.job_salary_period === "YEAR" ? "/yr" : j.job_salary_period === "MONTH" ? "/mo" : "";
    salary = `${cur} ${Math.round(j.job_min_salary / 1000)}k–${Math.round(j.job_max_salary / 1000)}k${period}`;
  } else if (j.job_min_salary) {
    const cur = j.job_salary_currency || "USD";
    salary = `${cur} ${Math.round(j.job_min_salary / 1000)}k+`;
  }

  const rawTags: string[] = j.job_required_skills?.length
    ? j.job_required_skills
    : (j.job_highlights?.Qualifications || [])
        .join(" ")
        .match(/\b(React|Node|Python|Java|SQL|AWS|Docker|Kubernetes|TypeScript|JavaScript|Go|C\+\+|ML|AI|Excel|Figma|Git)\b/g) || [];

  return {
    id:          j.job_id,
    title:       j.job_title || "Software Engineer",
    company:     j.employer_name || "Company",
    location:    location || "India",
    type:        JOB_TYPE_LABELS[j.job_employment_type] || j.job_employment_type || "Full-time",
    source:      j.job_publisher || "JSearch",
    description: j.job_description.replace(/\n+/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) + "…",
    salary,
    postedAt:    j.job_posted_at_datetime_utc || new Date().toISOString(),
    applyUrl:    j.job_apply_link || "#",
    logo:        j.employer_logo || "",
    tags:        [...new Set(rawTags)].slice(0, 5),
  };
}

async function fetchJSearch(search: string, category: string): Promise<Job[]> {
  if (!RAPIDAPI_KEY) throw new Error("VITE_RAPIDAPI_KEY is not set in your .env file.");

  const catEntry = CATEGORIES.find((c) => c.id === category);
  const query    = search ? `${search} jobs India` : (catEntry?.query || CATEGORIES[0].query);

  const params = new URLSearchParams({ query, num_pages: "3", page: "1" });
  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: {
      "X-RapidAPI-Key":  RAPIDAPI_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  if (!res.ok) throw new Error(`JSearch API responded with ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK") throw new Error(data.error?.message || "JSearch returned an error");

  return (data.data || []).map(normalise) as Job[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return "Recently"; }
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

const GRADIENTS = [
  "from-blue-500 to-cyan-500",    "from-violet-500 to-purple-600",
  "from-orange-500 to-rose-500",  "from-green-500 to-emerald-500",
  "from-pink-500 to-rose-500",    "from-amber-500 to-yellow-500",
  "from-teal-500 to-cyan-600",    "from-sky-500 to-blue-600",
];

function companyGradient(name: string) {
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[h];
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, saved, onSave }: { job: Job; saved: boolean; onSave: (id: string) => void }) {
  const grad     = companyGradient(job.company);
  const initials = getInitials(job.company);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group">
      <div className={`h-1 bg-gradient-to-r ${grad}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {job.logo ? (
              <img
                src={job.logo}
                alt={job.company}
                className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-white p-1 shadow-sm shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm shrink-0`}>
                <span className="text-white font-black text-sm">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-slate-500 text-sm font-medium flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{job.company}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onSave(job.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 border ${
              saved
                ? "bg-amber-50 text-amber-500 border-amber-200"
                : "bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500 border-slate-200"
            }`}
            title={saved ? "Saved" : "Save job"}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-amber-500" : ""}`} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Globe className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 font-semibold truncate max-w-[120px]">
              {job.location || "Remote"}
            </span>
          </span>
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
            {job.type}
          </span>
          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-semibold">
            via {job.source}
          </span>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
          {job.description}
        </p>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {job.salary && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                <Zap className="w-3 h-3" />{job.salary}
              </span>
            )}
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(job.postedAt)}
            </span>
          </div>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-100"
          >
            Apply Now <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category,    setCategory]    = useState("");
  const [page,        setPage]        = useState(1);
  const [savedJobs,   setSavedJobs]   = useState<Set<string>>(new Set());

  const JOBS_PER_PAGE = 9;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
      setSavedJobs(new Set(saved));
    } catch {}
  }, []);

  const loadJobs = useCallback(async (kw: string, cat: string) => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const fetched = await fetchJSearch(kw, cat);
      setJobs(fetched);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs(search, category);
  }, [search, category, loadJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleCategory = (id: string) => {
    setCategory(id);
  };

  const goToPage = (pg: number) => {
    setPage(pg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSave = (id: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("savedJobs", JSON.stringify([...next]));
      return next;
    });
  };

  const totalPages  = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const pagedJobs   = jobs.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);
  const activeCat   = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-20">
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-200 text-xs font-bold backdrop-blur-sm">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              Live Jobs — Powered by JSearch · LinkedIn · Indeed · Glassdoor
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
              Tech Jobs in{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                India
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              Real job listings from LinkedIn, Indeed & Glassdoor — aggregated by JSearch in real-time
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl">
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by role, skill, company…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 text-sm text-slate-800 outline-none placeholder-slate-400 font-medium"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg text-sm transition-all hover:scale-105 active:scale-100"
              >
                <Search className="w-4 h-4" />Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { label: "Jobs Found",   value: loading ? "…" : `${jobs.length}+`, icon: Briefcase },
              { label: "Sources",      value: "LinkedIn · Indeed",                icon: Globe     },
              { label: "Powered by",   value: "JSearch API",                      icon: Zap       },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <s.icon className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-none">{s.value}</p>
                  <p className="text-slate-400 text-[10px] font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-50" style={{ borderRadius: "100% 100% 0 0 / 100% 100% 0 0", transform: "scaleY(-1)" }} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Remotive banner ───────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-emerald-800 font-bold text-sm">Live · India-focused Jobs</p>
            <p className="text-emerald-600 text-xs">Jobs aggregated in real-time from <span className="font-semibold">LinkedIn, Indeed & Glassdoor</span> via the JSearch API.</p>
          </div>
          <a
            href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            JSearch API <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* ── Category pills ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const Icon   = cat.icon;
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all border ${
                    active
                      ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md scale-105`
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div className="text-slate-700 font-semibold text-sm">
            {loading ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />Fetching jobs…
              </span>
            ) : (
              <span>
                <span className="text-blue-600 font-black">{jobs.length}</span> jobs
                {search && <span className="text-slate-400 font-normal"> for "{search}"</span>}
                {category && <span className="text-slate-400 font-normal"> in {activeCat.label}</span>}
                {totalPages > 1 && <span className="text-slate-400 font-normal"> — page {page} of {totalPages}</span>}
              </span>
            )}
          </div>
          <button
            onClick={() => loadJobs(search, category)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="h-1 bg-slate-100 rounded mb-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (error && jobs.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Could not load jobs</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">{error}</p>
            <button
              onClick={() => loadJobs(search, category)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No jobs found</h3>
            <p className="text-slate-500 text-sm mb-5">Try different keywords or switch to "All Jobs".</p>
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setCategory(""); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
            >
              Show All Jobs
            </button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {pagedJobs.map((job) => (
                <JobCard key={job.id} job={job} saved={savedJobs.has(job.id)} onSave={toggleSave} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mb-8">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />Prev
                </button>
                <div className="flex items-center gap-1">
                  {page > 2 && (
                    <button onClick={() => goToPage(1)} className="w-9 h-9 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">1</button>
                  )}
                  {page > 3 && <span className="text-slate-400 text-sm px-1">…</span>}
                  {[page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${p === page ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {p}
                    </button>
                  ))}
                  {page < totalPages - 2 && <span className="text-slate-400 text-sm px-1">…</span>}
                  {page < totalPages - 1 && (
                    <button onClick={() => goToPage(totalPages)} className="w-9 h-9 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">{totalPages}</button>
                  )}
                </div>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Tips for Freshers ──────────────────────────────────────────────── */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Star,   title: "Polish Your Resume",  tip: "Use our AI Resume Analyzer to score and improve your resume before applying.", link: "/resume-analyzer",  cta: "Analyze Resume" },
            { icon: Users,  title: "Mock Interviews",     tip: "Practice with our mock assessments to ace technical and HR interview rounds.",  link: "/mock-assessments", cta: "Start Practice"  },
            { icon: Code2,  title: "DSA Practice",        tip: "Strengthen fundamentals — most fresher rounds test Data Structures & Algorithms.", link: "/practice",     cta: "Practice DSA"   },
          ].map((tip) => (
            <div key={tip.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md">
                <tip.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 text-sm">{tip.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">{tip.tip}</p>
              <Link to={tip.link} className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold hover:text-blue-700">
                {tip.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
