import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame, Trophy, Code2, TrendingUp, Clock,
  CheckCircle2, Star, Target, BookOpen, Zap, Medal,
  ChevronRight, ChevronLeft, Play, Lock, Award, BarChart3,
  Briefcase, Brain, Users, FileText, Globe, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { userApi, problemApi } from "@/lib/api";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  problemsSolved: number;
  currentStreak: number;
  longestStreak: number;
  contestRating: number;
  codingTimeHours: number;
  globalRank: number;
}

interface EnrollmentDetail {
  course: { _id: string; title: string; slug: string; color: string; icon: string };
  progress: number;
  completedSubtopics: number;
  totalSubtopics: number;
  lastLesson: string | null;
}

interface Activity {
  _id: string;
  action: string;
  activityType: string;
  createdAt: string;
}

interface CalendarDay {
  date: string;
  level: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  achievementType: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface DashboardData {
  stats: Stats;
  enrollments: EnrollmentDetail[];
  recentActivity: Activity[];
  activityCalendar: CalendarDay[];
  achievements: Achievement[];
}

interface Potd {
  title: string;
  slug: string;
  difficulty: string;
  topicTag: string;
  description: string;
  type?: "coding" | "sql";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Code2, BarChart3, Globe, Zap, BookOpen, TrendingUp, Award, Target, Brain, Briefcase, Users, FileText,
};

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  solved:    { icon: CheckCircle2, color: "text-green-500" },
  completed: { icon: Award,        color: "text-blue-500"  },
  badge:     { icon: Star,         color: "text-yellow-500"},
  attempted: { icon: Code2,        color: "text-purple-500"},
  enrolled:  { icon: BookOpen,     color: "text-cyan-500"  },
};

const ACHIEVEMENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  first_blood:    { icon: Zap,    color: "text-yellow-500" },
  week_warrior:   { icon: Flame,  color: "text-orange-500" },
  problem_solver: { icon: Target, color: "text-blue-500"   },
  top_performer:  { icon: Trophy, color: "text-purple-500" },
};

const interviewPrepData = [
  { id: 1, title: "Data Structures", tagline: "Master the fundamentals", icon: Brain, color: "from-blue-500 to-cyan-500", topics: 45, problems: 250 },
  { id: 2, title: "System Design",   tagline: "Build scalable systems",  icon: Briefcase, color: "from-purple-500 to-pink-500", topics: 28, problems: 85 },
  { id: 3, title: "Mock Interviews", tagline: "Practice with experts",   icon: Users, color: "from-orange-500 to-red-500", topics: 15, problems: 50 },
  { id: 4, title: "Company Specific",tagline: "Target your dream job",   icon: FileText, color: "from-green-500 to-emerald-500", topics: 35, problems: 400 },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Calendar builder ─────────────────────────────────────────────────────────
function buildCalendarGrid(calendarData: CalendarDay[], year: number, month: number) {
  const calMap = new Map(calendarData.map((d) => [d.date, d.level]));
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days: any[] = [];
  for (let i = 0; i < firstDay; i++) days.push({ type: "empty", key: `e-${i}` });
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const level = calMap.get(dateStr) ?? 0;
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    days.push({ type: "day", day: d, isToday, level, key: `d-${d}`, dateStr });
  }
  return days;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, bgColor, textColor }: { icon: any; label: string; value: string | number; color?: string; bgColor: string; textColor: string }) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${textColor}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-xl font-black text-slate-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [codingPotd, setCodingPotd] = useState<Potd | null>(null);
  const [sqlPotd,    setSqlPotd]    = useState<Potd | null>(null);
  const [potdLoading, setPotdLoading] = useState(true);

  // Calendar navigation
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = storedUser?.name?.split(" ")[0] || storedUser?.email?.split("@")[0] || "Student";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    // Fetch POTD — API returns { codingProblem, sqlProblem, date }
    setPotdLoading(true);
    problemApi.getPotd()
      .then((res: any) => {
        setCodingPotd(res?.codingProblem || null);
        setSqlPotd(res?.sqlProblem    || null);
      })
      .catch(() => { setCodingPotd(null); setSqlPotd(null); })
      .finally(() => setPotdLoading(false));

    userApi.getDashboardStats()
      .then(setData)
      .catch(() => {
        setData({
          stats: { problemsSolved: 0, currentStreak: 0, longestStreak: 0, contestRating: 0, codingTimeHours: 0, globalRank: 0 },
          enrollments: [],
          recentActivity: [],
          activityCalendar: [],
          achievements: [
            { id: "first_blood",    title: "First Blood",    description: "Solve your first problem", achievementType: "problem", unlocked: false },
            { id: "week_warrior",   title: "Week Warrior",   description: "7-day streak",             achievementType: "streak",  unlocked: false },
            { id: "problem_solver", title: "Problem Solver", description: "Solve 100 problems",       achievementType: "problem", unlocked: false },
            { id: "top_performer",  title: "Top Performer",  description: "Reach top 10",             achievementType: "rank",    unlocked: false },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Calendar navigation helpers
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };
  const goToToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); };
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth();

  const stats = data?.stats;
  const calendarDays = buildCalendarGrid(data?.activityCalendar || [], calYear, calMonth);
  const activeDaysCount = calendarDays.filter((d) => d.type === "day" && d.level > 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{userName}</span>!{" "}
            <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {(stats?.currentStreak || 0) > 0 ? "Let's make today count. Keep your streak alive!" : "Start your learning journey today!"}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="border-0 shadow-md"><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-12" /></div></div></CardContent></Card>
            ))
          ) : (
            <>
              <StatCard icon={Code2}  label="Problems Solved" value={stats?.problemsSolved ?? 0} color="from-blue-500 to-cyan-500"   bgColor="bg-blue-50"   textColor="text-blue-600" />
              <StatCard icon={Trophy} label="Global Rank"      value={stats?.globalRank ? `#${stats.globalRank.toLocaleString()}` : "—"} color="from-yellow-500 to-orange-500" bgColor="bg-yellow-50" textColor="text-yellow-600" />
              <StatCard icon={Target} label="Contest Rating"   value={stats?.contestRating ?? 0} color="from-purple-500 to-pink-500"  bgColor="bg-purple-50" textColor="text-purple-600" />
              <StatCard icon={Clock}  label="Coding Time"      value={stats?.codingTimeHours ? `${stats.codingTimeHours}h` : "0h"} color="from-green-500 to-emerald-500" bgColor="bg-green-50" textColor="text-green-600" />
            </>
          )}
        </div>

        {/* ── POTD + Calendar ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

          {/* POTD Cards — takes 3 cols, split into Coding + SQL side-by-side */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* ── Coding POTD ── */}
            <Card className="border-0 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="relative p-4 flex flex-col gap-2 h-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/15 rounded-full border border-white/20">
                    <Code2 className="w-3 h-3 text-blue-200" />
                    <span className="text-blue-100 font-bold text-[10px] uppercase tracking-wide">Coding Challenge</span>
                  </div>
                  {codingPotd && (
                    <Badge className={`text-[10px] font-bold border ${
                      codingPotd.difficulty === "Easy"   ? "bg-green-500/20 text-green-200 border-green-400/30" :
                      codingPotd.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30" :
                      "bg-red-500/20 text-red-200 border-red-400/30"
                    }`}>{codingPotd.difficulty}</Badge>
                  )}
                </div>
                <h2 className="text-base font-black text-white leading-tight">
                  {potdLoading ? <Skeleton className="h-5 w-36 bg-white/20" /> : codingPotd ? codingPotd.title : <span className="text-white/60 text-sm">No coding problem today</span>}
                </h2>
                <p className="text-blue-100/75 text-[11px] leading-relaxed line-clamp-2 flex-1">
                  {potdLoading ? "Loading…" : codingPotd ? codingPotd.description.replace(/<[^>]*>/g, "").slice(0, 90) + "…" : "Check back later."}
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {codingPotd && <span className="text-[10px] text-blue-300 font-semibold">{codingPotd.topicTag}</span>}
                  {potdLoading ? <Skeleton className="h-7 w-24 bg-white/20 rounded-lg" /> : codingPotd ? (
                    <Link to={`/problems/${codingPotd.slug}`}>
                      <button className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs px-3 py-1.5 rounded-lg shadow hover:scale-105 transition-all">
                        <Play className="w-3 h-3 fill-blue-600" />Solve
                      </button>
                    </Link>
                  ) : (
                    <Link to="/problems">
                      <button className="flex items-center gap-1.5 bg-white/20 text-white border border-white/30 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all">Browse</button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>

            {/* ── SQL POTD ── */}
            <Card className="border-0 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="relative p-4 flex flex-col gap-2 h-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/15 rounded-full border border-white/20">
                    <Database className="w-3 h-3 text-emerald-200" />
                    <span className="text-emerald-100 font-bold text-[10px] uppercase tracking-wide">SQL Challenge</span>
                  </div>
                  {sqlPotd && (
                    <Badge className={`text-[10px] font-bold border ${
                      sqlPotd.difficulty === "Easy"   ? "bg-green-500/20 text-green-200 border-green-400/30" :
                      sqlPotd.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30" :
                      "bg-red-500/20 text-red-200 border-red-400/30"
                    }`}>{sqlPotd.difficulty}</Badge>
                  )}
                </div>
                <h2 className="text-base font-black text-white leading-tight">
                  {potdLoading ? <Skeleton className="h-5 w-36 bg-white/20" /> : sqlPotd ? sqlPotd.title : <span className="text-white/60 text-sm">No SQL problem today</span>}
                </h2>
                <p className="text-emerald-100/75 text-[11px] leading-relaxed line-clamp-2 flex-1">
                  {potdLoading ? "Loading…" : sqlPotd ? sqlPotd.description.replace(/<[^>]*>/g, "").slice(0, 90) + "…" : "Seed SQL problems to enable this section."}
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {sqlPotd && <span className="text-[10px] text-emerald-300 font-semibold">{sqlPotd.topicTag}</span>}
                  {potdLoading ? <Skeleton className="h-7 w-24 bg-white/20 rounded-lg" /> : sqlPotd ? (
                    <Link to={`/problems/${sqlPotd.slug}`}>
                      <button className="flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs px-3 py-1.5 rounded-lg shadow hover:scale-105 transition-all">
                        <Play className="w-3 h-3 fill-emerald-600" />Solve
                      </button>
                    </Link>
                  ) : (
                    <Link to="/problem-of-the-day">
                      <button className="flex items-center gap-1.5 bg-white/20 text-white border border-white/30 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all">View All</button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>

          </div>

          {/* Calendar Card — takes 2 cols */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg h-full bg-white">
              <CardHeader className="pb-1.5 pt-3 px-3">
                <div className="flex items-center justify-between">
                  {/* Month nav */}
                  <div className="flex items-center gap-0.5">
                    <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <div className="text-center min-w-[100px]">
                      <p className="text-xs font-black text-slate-800">{MONTH_NAMES[calMonth]} {calYear}</p>
                    </div>
                    <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCurrentMonth && (
                      <button onClick={goToToday} className="px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                        Today
                      </button>
                    )}
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] font-black px-1.5 py-0.5">
                      {activeDaysCount}d active
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-3 pb-3 pt-0">
                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 mb-0.5">
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-slate-400 py-0.5">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day: any) => (
                    <div
                      key={day.key}
                      title={day.type === "day" ? `${day.dateStr}: ${day.level > 0 ? "Active" : "No activity"}` : ""}
                      className={`h-7 w-full rounded flex items-center justify-center text-[9px] font-semibold transition-all ${
                        day.type === "empty" ? "" :
                        day.level > 0 ? "bg-green-500 text-white" :
                        "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      } ${day.isToday ? "ring-2 ring-blue-500 ring-offset-1 font-black" : ""}`}
                    >
                      {day.type === "day" ? day.day : ""}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-slate-100" />
                    <span className="text-[9px] text-slate-400 font-medium">No activity</span>
                    <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                    <span className="text-[9px] text-slate-400 font-medium">Active</span>
                  </div>
                  {/* Year quick-jump */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCalYear((y) => y - 1)} className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors">
                      {calYear - 1}
                    </button>
                    <span className="text-[9px] font-black text-blue-600">{calYear}</span>
                    <button onClick={() => setCalYear((y) => y + 1)} className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors">
                      {calYear + 1}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Streak Cards ──────────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                    <span className="text-slate-500 font-medium text-sm">Current Streak</span>
                  </div>
                  {loading ? <Skeleton className="h-9 w-14 mb-1" /> : (
                    <p className="text-3xl font-black text-slate-900 mb-0.5">{stats?.currentStreak ?? 0}</p>
                  )}
                  <p className="text-slate-400 text-xs font-medium">days in a row</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                  <Flame className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Next milestone: 30 days</span>
                  <span className="font-bold text-orange-600">{stats?.currentStreak ?? 0}/30</span>
                </div>
                <Progress value={((stats?.currentStreak ?? 0) / 30) * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="w-5 h-5 text-purple-500" />
                    <span className="text-slate-500 font-medium text-sm">Longest Streak</span>
                  </div>
                  {loading ? <Skeleton className="h-9 w-14 mb-1" /> : (
                    <p className="text-3xl font-black text-slate-900 mb-0.5">{stats?.longestStreak ?? 0}</p>
                  )}
                  <p className="text-slate-400 text-xs font-medium">personal best</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                  <Medal className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                {(stats?.longestStreak ?? 0) === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">Start your streak today! 🔥</p>
                ) : (stats?.longestStreak ?? 0) <= (stats?.currentStreak ?? 0) ? (
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />You're at your personal best!</p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    {(stats?.longestStreak ?? 0) - (stats?.currentStreak ?? 0)} days to beat your record
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Interview Prep ────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Interview Prep Guide</h2>
                <p className="text-slate-500 text-xs font-medium">Prepare for your dream company</p>
              </div>
            </div>
            <Link to="/courses">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 text-xs">
                View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {interviewPrepData.map((prep) => (
              <Link key={prep.id} to="/courses">
                <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer group overflow-hidden">
                  <div className={`h-0.5 bg-gradient-to-r ${prep.color}`} />
                  <CardContent className="pt-3 pb-4">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${prep.color} flex items-center justify-center shadow-sm mb-2.5 group-hover:scale-105 transition-transform`}>
                      <prep.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-0.5">{prep.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium mb-2">{prep.tagline}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400"><span className="font-bold text-slate-600">{prep.topics}</span> topics</span>
                      <span className="text-slate-400"><span className="font-bold text-slate-600">{prep.problems}</span> problems</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ── My Courses + Recent Activity ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-stretch">
          <div className="lg:col-span-2 h-full">
            <Card className="border-0 shadow-lg h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">My Courses</CardTitle>
                      <CardDescription className="text-xs">Continue your learning journey</CardDescription>
                    </div>
                  </div>
                  <Link to="/courses">
                    <Button variant="ghost" size="sm" className="text-blue-600 text-xs h-7">
                      View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-1.5 w-full" /><Skeleton className="h-2.5 w-28" /></div>
                      </div>
                    ))}
                  </div>
                ) : (data?.enrollments?.length || 0) === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                    <p className="font-semibold text-slate-500 text-sm mb-1">No courses yet</p>
                    <Link to="/courses"><Button size="sm" className="font-bold text-xs mt-2">Browse Courses</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data!.enrollments.map((enr) => {
                      const IconComp = ICON_MAP[enr.course.icon] || BookOpen;
                      return (
                        <div key={enr.course._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-all group">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${enr.course.color || "from-blue-500 to-cyan-500"} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                            <IconComp className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <Link to={`/learn/${enr.course.slug}`} className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">{enr.course.title}</Link>
                              <span className="text-xs font-medium text-slate-400 shrink-0 ml-2">{enr.completedSubtopics}/{enr.totalSubtopics || "—"}</span>
                            </div>
                            <Progress value={enr.progress} className="h-1.5 mb-1" />
                            <p className="text-[10px] text-slate-400">{enr.lastLesson ? <>Next: <span className="font-medium text-slate-600">{enr.lastLesson}</span></> : "Start your first lesson"}</p>
                          </div>
                          <Link to={`/learn/${enr.course.slug}`} className="opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-100 w-7 h-7">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="h-full">
            <Card className="border-0 shadow-lg h-full flex flex-col">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Recent Activity</CardTitle>
                      <CardDescription className="text-xs">Your latest actions</CardDescription>
                    </div>
                  </div>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="text-green-600 text-xs h-7">
                      View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex items-start gap-2.5 p-1.5">
                        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-1"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-16" /></div>
                      </div>
                    ))}
                  </div>
                ) : (data?.recentActivity?.length || 0) === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                    <p className="text-xs font-medium text-slate-400">No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data!.recentActivity.slice(0, 4).map((activity) => {
                      const iconData = ACTIVITY_ICONS[activity.activityType] || ACTIVITY_ICONS.solved;
                      const IconComp = iconData.icon;
                      return (
                        <div key={activity._id} className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <IconComp className={`w-3.5 h-3.5 ${iconData.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-700 text-xs truncate">{activity.action}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(activity.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Achievements ──────────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Award className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Achievements</CardTitle>
                  <CardDescription className="text-xs">Badges you've earned</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 text-center space-y-2">
                    <Skeleton className="w-10 h-10 mx-auto rounded-xl" />
                    <Skeleton className="h-3.5 w-20 mx-auto" />
                    <Skeleton className="h-2.5 w-16 mx-auto" />
                  </div>
                ))
              ) : (
                (data?.achievements || []).map((ach) => {
                  const iconData = ACHIEVEMENT_ICONS[ach.id] || { icon: Award, color: "text-slate-400" };
                  const IconComp = iconData.icon;
                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-xl text-center transition-all ${ach.unlocked ? "bg-slate-50 hover:shadow-md cursor-pointer hover:-translate-y-0.5" : "bg-slate-50 opacity-50"}`}
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-white shadow-sm flex items-center justify-center ${!ach.unlocked ? "grayscale" : ""}`}>
                        <IconComp className={`w-5 h-5 ${iconData.color}`} />
                      </div>
                      <p className="font-bold text-slate-900 text-xs mb-0.5">{ach.title}</p>
                      <p className="text-[10px] text-slate-500">{ach.description}</p>
                      {ach.unlocked
                        ? <Badge className="mt-1.5 bg-green-100 text-green-700 border-green-200 text-[9px]">Unlocked</Badge>
                        : <Lock className="w-3.5 h-3.5 mx-auto mt-1.5 text-slate-300" />
                      }
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />

      <style>{`
        @keyframes wave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(15deg)} 75%{transform:rotate(-15deg)} }
        .animate-wave { animation: wave 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
