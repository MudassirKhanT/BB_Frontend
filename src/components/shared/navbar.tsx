import { useState, useEffect, useRef } from "react";
import { Menu, X, Zap, User, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const mainLinks = [
  { label: "Courses", to: "/courses" },
  { label: "Practice", to: "/practice" },
  { label: "Company Prep", to: "/company-prep" },
  { label: "Contests", to: "/contests" },
];

const resourceLinks = [
  { label: "Problem of the Day", to: "/problem-of-the-day" },
  { label: "Mock Tests", to: "/mock-assessments" },
  { label: "Resume AI", to: "/resume-analyzer" },
  { label: "AI Roadmap", to: "/roadmap-generator" },
  { label: "AI Hackathon", to: "/hackathon" },
  { label: "Alumni Connect", to: "/alumni-connect" },
  { label: "Interview Experiences", to: "/resources/interview-experiences" },
  { label: "Resource Hub", to: "/resources" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Jobs", to: "/jobs" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const username: string = storedUser.username || storedUser.name || "User";
  const initials = username.split(" ").map((w: string) => w[0]?.toUpperCase() || "").slice(0, 2).join("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className={`sticky top-0 z-50 w-full h-16 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      {/* Logo */}
      <div className="flex items-center gap-6 lg:gap-10 min-w-0">
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            beyond<span className="text-primary">basic</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold text-slate-600">
          {mainLinks.map(({ label, to }) => (
            <Link key={label} to={to} className="hover:text-primary transition-colors whitespace-nowrap">
              {label}
            </Link>
          ))}

          {/* Resources dropdown */}
          <div
            ref={resourcesRef}
            className="relative"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className={`flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap ${resourcesOpen ? "text-primary" : ""}`}
            >
              Resources
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>

            {resourcesOpen && (
              <div className="absolute left-0 top-full pt-2 z-50 w-56">
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 overflow-hidden">
                  {resourceLinks.map(({ label, to }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isLoggedIn ? (
          <div className="relative hidden md:block" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                {initials || <User className="w-4 h-4" />}
              </div>
              <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate">{username}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400" /> Dashboard
                </Link>
                <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400" /> My Profile
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all">
              Log in
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-px active:translate-y-0 transition-all whitespace-nowrap">
              Join the Batch
            </Link>
          </div>
        )}

        <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg px-6 py-4 flex flex-col gap-1 md:hidden" style={{ borderBottom: "1px solid #f1f5f9" }}>
          {mainLinks.map(({ label, to }) => (
            <Link key={label} to={to} className="font-semibold text-slate-700 hover:text-primary py-2" onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
          <div className="pt-1 pb-1" style={{ borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", marginTop: 4, marginBottom: 4 }}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0 pb-2 pt-2">Resources</p>
            {resourceLinks.map(({ label, to }) => (
              <Link key={label} to={to} className="block font-semibold text-slate-600 hover:text-primary py-1.5 text-sm" onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
          {isLoggedIn && (
            <Link to="/profile" className="font-semibold text-slate-700 hover:text-primary py-2" onClick={() => setMenuOpen(false)}>
              My Profile
            </Link>
          )}
          <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center text-slate-700 hover:bg-slate-50 transition-all" style={{ border: "1px solid #e2e8f0" }} onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center text-slate-700 hover:bg-slate-50 transition-all" style={{ border: "1px solid #e2e8f0" }} onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="flex-1 py-2.5 rounded-xl bg-primary text-center text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all" onClick={() => setMenuOpen(false)}>
                  Join Batch
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
