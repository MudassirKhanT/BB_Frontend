import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import {
  BookOpen, Code2, Building2, Trophy, ClipboardList,
  FileText, UserCog, AlertCircle, TrendingUp, ArrowRight,
} from "lucide-react";

interface Stats {
  courses: number; problems: number; companies: number;
  contests: number; mockExams: number; resources: number;
  users: number; pendingExp: number;
}

const CARDS = [
  { key: "courses",    label: "Courses",           icon: BookOpen,      from: "from-blue-500",    to: "to-blue-600",    bg: "bg-blue-50",    text: "text-blue-600",    nav: "courses" },
  { key: "problems",   label: "Problems",          icon: Code2,         from: "from-violet-500",  to: "to-violet-600",  bg: "bg-violet-50",  text: "text-violet-600",  nav: "problems" },
  { key: "companies",  label: "Companies",         icon: Building2,     from: "from-emerald-500", to: "to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600", nav: "companies" },
  { key: "contests",   label: "Contests",          icon: Trophy,        from: "from-amber-500",   to: "to-amber-600",   bg: "bg-amber-50",   text: "text-amber-600",   nav: "contests" },
  { key: "mockExams",  label: "Mock Exams",        icon: ClipboardList, from: "from-rose-500",    to: "to-rose-600",    bg: "bg-rose-50",    text: "text-rose-600",    nav: "mock-exams" },
  { key: "resources",  label: "Resources",         icon: FileText,      from: "from-cyan-500",    to: "to-cyan-600",    bg: "bg-cyan-50",    text: "text-cyan-600",    nav: "resources" },
  { key: "users",      label: "Users",             icon: UserCog,       from: "from-slate-500",   to: "to-slate-600",   bg: "bg-slate-100",  text: "text-slate-600",   nav: "users" },
  { key: "pendingExp", label: "Pending Approvals", icon: AlertCircle,   from: "from-orange-500",  to: "to-orange-600",  bg: "bg-orange-50",  text: "text-orange-600",  nav: "interview-exp" },
] as const;

export default function OverviewPanel({ onNav, refreshKey = 0 }: { onNav: (id: string) => void; refreshKey?: number }) {
  const [stats, setStats] = useState<Stats>({ courses: 0, problems: 0, companies: 0, contests: 0, mockExams: 0, resources: 0, users: 0, pendingExp: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get("/course"),
      api.get("/problems/admin/all"),
      api.get("/company"),
      api.get("/contest/admin/all"),
      api.get("/mock/admin/all"),
      api.get("/resource/admin/all"),
      api.get("/user/admin/all"),
      api.get("/interview-experience/pending"),
    ]).then(results => {
      const count = (i: number) => {
        const r = results[i];
        if (r.status !== "fulfilled") return 0;
        const d = r.value;
        return Array.isArray(d) ? d.length : 0;
      };
      setStats({
        courses: count(0), problems: count(1), companies: count(2),
        contests: count(3), mockExams: count(4), resources: count(5),
        users: count(6), pendingExp: count(7),
      });
      setLoading(false);
    });
  }, [refreshKey]);

  const hasPending = stats.pendingExp > 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-violet-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <TrendingUp className="w-8 h-8 text-blue-300 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-black mb-1">Welcome to the Admin Dashboard</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Manage all platform content from here. Click any card below to jump directly to that section.
              {hasPending && (
                <span className="text-orange-300 font-semibold">
                  {" "}⚠ {stats.pendingExp} interview experience{stats.pendingExp > 1 ? "s" : ""} waiting for approval!
                </span>
              )}
            </p>
            {hasPending && (
              <button onClick={() => onNav("interview-exp")}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 border border-orange-400/40 rounded-lg px-3 py-1.5 hover:bg-orange-400/10 transition-colors">
                Review Pending <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon: Icon, bg, text, nav }) => {
          const value = stats[key as keyof Stats];
          const isPending = key === "pendingExp" && value > 0;
          return (
            <button key={key} onClick={() => onNav(nav)}
              className={`text-left p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group ${isPending ? "border-orange-200 ring-2 ring-orange-200/60" : "border-slate-100"}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              {loading ? (
                <div className="w-12 h-7 bg-slate-200 rounded-lg animate-pulse mb-1" />
              ) : (
                <p className={`text-3xl font-black ${isPending ? "text-orange-500" : "text-slate-900"}`}>{value}</p>
              )}
              <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">{label}</p>
              {isPending && (
                <span className="mt-1.5 inline-block text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Needs Action
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-black text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: "Add Course",    nav: "courses" },
            { label: "Add Problem",   nav: "problems" },
            { label: "Add Company",   nav: "companies" },
            { label: "Add Contest",   nav: "contests" },
            { label: "Add Mock Exam", nav: "mock-exams" },
            { label: "Add Resource",  nav: "resources" },
            { label: "Manage Users",  nav: "users" },
            { label: "Review Exp.",   nav: "interview-exp" },
          ].map(({ label, nav }) => (
            <button key={nav} onClick={() => onNav(nav)}
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
              {label}
              <ArrowRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
