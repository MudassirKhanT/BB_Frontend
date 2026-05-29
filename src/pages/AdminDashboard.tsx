import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Code2, Building2, Trophy,
  ClipboardList, FileText, Users, UserCog, ChevronRight,
  Menu, Zap, LogOut, GraduationCap,
} from "lucide-react";
import OverviewPanel from "../components/admin/OverviewPanel";
import CoursesPanel from "../components/admin/CoursesPanel";
import ProblemsPanel from "../components/admin/ProblemsPanel";
import CompanyPanel from "../components/admin/CompanyPanel";
import ContestPanel from "../components/admin/ContestPanel";
import MockPanel from "../components/admin/MockPanel";
import ResourcePanel from "../components/admin/ResourcePanel";
import InterviewExpPanel from "../components/admin/InterviewExpPanel";
import UsersPanel from "../components/admin/UsersPanel";
import HackathonPanel from "../components/admin/HackathonPanel";
import AlumniPanel from "../components/admin/AlumniPanel";

const NAV = [
  { id: "overview",      label: "Overview",          icon: LayoutDashboard },
  { id: "courses",       label: "Courses",            icon: BookOpen },
  { id: "problems",      label: "Problems",           icon: Code2 },
  { id: "companies",     label: "Companies",          icon: Building2 },
  { id: "contests",      label: "Contests",           icon: Trophy },
  { id: "hackathon",     label: "Hackathon",          icon: Trophy },
  { id: "mock-exams",    label: "Mock Exams",         icon: ClipboardList },
  { id: "resources",     label: "Resources",          icon: FileText },
  { id: "interview-exp", label: "Interview Exp.",     icon: Users },
  { id: "alumni",        label: "Alumni",             icon: GraduationCap },
  { id: "users",         label: "Users",              icon: UserCog },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const [overviewKey, setOverviewKey] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user.role !== "admin") navigate("/", { replace: true });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navTo = (id: string) => {
    if (id === "overview") setOverviewKey((k) => k + 1);
    setActive(id);
    setSideOpen(false);
  };

  const PANELS: Record<string, React.ReactNode> = {
    overview:        <OverviewPanel onNav={navTo} refreshKey={overviewKey} />,
    courses:         <CoursesPanel />,
    problems:        <ProblemsPanel />,
    companies:       <CompanyPanel />,
    contests:        <ContestPanel />,
    hackathon:       <HackathonPanel />,
    "mock-exams":    <MockPanel />,
    resources:       <ResourcePanel />,
    "interview-exp": <InterviewExpPanel />,
    alumni:          <AlumniPanel />,
    users:           <UsersPanel />,
  };

  const currentLabel = NAV.find(n => n.id === active)?.label ?? "Admin";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col
        bg-[#0f172a] border-r border-slate-800
        transition-transform duration-300
        ${sideOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">BeyondBasic</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => navTo(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                active === id
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate flex-1 text-left">{label}</span>
              {active === id && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-800 flex-shrink-0">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-xs font-bold truncate">{user.username || user.email || "Admin"}</p>
            <p className="text-slate-500 text-[10px]">{user.email}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              onClick={() => setSideOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-black text-slate-900 text-lg">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:block text-[10px] font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Admin
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow">
              <span className="text-white font-black text-xs">
                {(user.username || "A")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {PANELS[active]}
        </main>
      </div>
    </div>
  );
}
