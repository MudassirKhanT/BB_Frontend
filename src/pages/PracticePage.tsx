import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, Play, CheckCircle2, Circle, Code2, Target, BookOpen, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/shared/navbar";
import { problemApi } from "@/lib/api";

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  frequency: number;
  topicTag: string;
  leetcodeUrl: string;
  userStatus: "solved" | "attempted" | null;
  companies?: string[];
}

interface TopicGroup {
  topic: string;
  problems: Problem[];
  solved: number;
  total: number;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "text-green-600 bg-green-50 border-green-200",
  Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

function FrequencyBars({ frequency }: { frequency: number }) {
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-400", "bg-green-500"];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`w-1.5 h-3 rounded-sm ${i <= frequency ? colors[frequency - 1] : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

function TopicSection({ group, defaultOpen }: { group: TopicGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const progressPct = group.total > 0 ? Math.round((group.solved / group.total) * 100) : 0;

  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm mb-3" style={{ border: "1px solid #e2e8f0" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="font-bold text-slate-800 text-base">{group.topic}</span>
          <a href={`https://leetcode.com/tag/${group.topic.toLowerCase().replace(/\s+/g, "-")}/`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-blue-500 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-500">
            {group.solved} / {group.total}
          </span>
          <div className="w-32 hidden sm:block">
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #f1f5f9" }}>
          <div className="hidden sm:grid grid-cols-[40px_1fr_100px_80px_80px_80px_100px] gap-2 px-5 py-2 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Status</span>
            <span>Problem</span>
            <span>Difficulty</span>
            <span>Frequency</span>
            <span className="text-center">Companies</span>
            <span className="text-center">Leetcode</span>
            <span className="text-center">Actions</span>
          </div>

          {group.problems.map((problem, idx) => (
            <div key={problem._id} style={{ borderTop: "1px solid #f8fafc" }}>
              {/* Desktop row */}
              <div className={`hidden sm:grid grid-cols-[40px_1fr_100px_80px_80px_80px_100px] gap-2 items-center px-5 py-3 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                <div className="flex items-center justify-center">{problem.userStatus === "solved" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : problem.userStatus === "attempted" ? <Circle className="w-4 h-4 text-yellow-400" /> : <Circle className="w-4 h-4 text-slate-300" />}</div>
                <Link to={`/problems/${problem.slug}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-sm transition-colors truncate">{problem.title}</Link>
                <div><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${DIFFICULTY_STYLES[problem.difficulty]}`} style={{ border: "1px solid" }}>{problem.difficulty}</span></div>
                <FrequencyBars frequency={problem.frequency} />
                <div className="flex flex-col justify-center gap-1">
                  {problem.companies?.length ? (
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">{problem.companies.slice(0, 2).join(", ")}{problem.companies.length > 2 ? ` +${problem.companies.length - 2}` : ""}</span>
                  ) : <span className="text-slate-300 text-[10px]">No company tag</span>}
                </div>
                <div className="flex justify-center">
                  {problem.leetcodeUrl ? (
                    <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors" style={{ border: "1px solid #fed7aa" }} title="Open on LeetCode"><span className="text-orange-600 font-black text-[10px]">LC</span></a>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </div>
                <div className="flex justify-center">
                  <Link to={`/problems/${problem.slug}`} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors" style={{ border: "1px solid #e2e8f0" }} title="Solve">
                    <Play className="w-3 h-3 text-slate-500" />
                  </Link>
                </div>
              </div>
              {/* Mobile card */}
              <div className={`sm:hidden flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                <div className="shrink-0">{problem.userStatus === "solved" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : problem.userStatus === "attempted" ? <Circle className="w-4 h-4 text-yellow-400" /> : <Circle className="w-4 h-4 text-slate-300" />}</div>
                <div className="flex-1 min-w-0">
                  <Link to={`/problems/${problem.slug}`} className="font-semibold text-blue-600 text-sm truncate block">{problem.title}</Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${DIFFICULTY_STYLES[problem.difficulty]}`} style={{ border: "1px solid" }}>{problem.difficulty}</span>
                    {problem.companies?.length ? <span className="text-[10px] text-slate-400">{problem.companies[0]}{problem.companies.length > 1 ? ` +${problem.companies.length - 1}` : ""}</span> : null}
                  </div>
                </div>
                <Link to={`/problems/${problem.slug}`} className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100" title="Solve">
                  <Play className="w-3.5 h-3.5 text-blue-500" />
                </Link>
              </div>
            </div>
          ))}

          {group.problems.length === 0 && <div className="px-5 py-6 text-center text-slate-400 text-sm">No problems in this topic yet.</div>}
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  const [topics, setTopics] = useState<TopicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    problemApi
      .getAll()
      .then((data: any) => setTopics(data.topics || []))
      .catch((err: any) => setError(err.message || "Failed to load problems"))
      .finally(() => setLoading(false));
  }, []);

  const totalSolved = topics.reduce((sum, g) => sum + g.solved, 0);
  const totalProblems = topics.reduce((sum, g) => sum + g.total, 0);
  const overallProgress = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  const allCompanies = Array.from(new Set(topics.flatMap((group) => group.problems.flatMap((p) => p.companies || []))))
    .filter(Boolean)
    .sort();

  const filteredTopics = topics
    .map((group) => ({
      ...group,
      problems: group.problems.filter((p) => {
        const matchesFilter = filter === "all" || (filter === "solved" && p.userStatus === "solved") || (filter === "unsolved" && p.userStatus !== "solved");
        const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCompany = companyFilter === "all" || (p.companies || []).some((company) => company.toLowerCase() === companyFilter.toLowerCase());
        return matchesFilter && matchesSearch && matchesCompany;
      }),
    }))
    .filter((g) => g.problems.length > 0 || (!searchQuery && companyFilter === "all"));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">All Problems</p>
              <h1 className="text-2xl font-black text-slate-900">Practice Arena</h1>
            </div>
          </div>

          {!loading && totalProblems > 0 && (
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600">Overall Progress</span>
                  <span className="text-sm font-bold text-slate-800">
                    {totalSolved} / {totalProblems} solved
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2.5" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-blue-600">{overallProgress}%</p>
                <p className="text-xs text-slate-400">complete</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 flex-1 shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Search problems..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 text-slate-700" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
            {(["all", "solved", "unsolved"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                {f === "solved" ? "✓ Solved" : f === "unsolved" ? "○ Unsolved" : "All"}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white rounded-xl p-2 shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
            <label className="text-xs font-semibold text-slate-500 mr-2">Company</label>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="bg-transparent text-sm outline-none text-slate-700">
              <option value="all">All companies</option>
              {allCompanies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse" style={{ border: "1px solid #e2e8f0" }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Failed to load problems</p>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">
              Try Again
            </Button>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500 mb-1">{searchQuery ? "No problems match your search" : "No problems available yet"}</p>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filteredTopics.map((group, i) => (
              <TopicSection key={group.topic} group={group} defaultOpen={i === 0} />
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && !error && topics.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
              <p className="text-2xl font-black text-green-600">{totalSolved}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Solved</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
              <p className="text-2xl font-black text-orange-500">{totalProblems - totalSolved}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Remaining</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
              <p className="text-2xl font-black text-blue-600">{topics.length}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Topics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
