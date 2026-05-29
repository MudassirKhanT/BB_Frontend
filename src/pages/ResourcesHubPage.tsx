import { Link } from "react-router-dom";
import {
  MessageSquare, FileText, Code2, BookOpen, PenLine,
  ArrowRight, Users, Star, Zap, Rocket,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

const CATEGORIES = [
  {
    slug: "interview-experiences",
    label: "Interview Experiences",
    description: "Real stories from students who cracked placements at top companies. Learn what to expect and how to prepare.",
    icon: MessageSquare,
    color: "from-violet-500 to-purple-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    badge: "Community",
    badgeColor: "bg-violet-100 text-violet-700",
    count: "500+ experiences",
  },
  {
    slug: "company-papers",
    label: "Company Papers",
    description: "Past placement papers, online assessment patterns, and previous-year questions from service and product companies.",
    icon: FileText,
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badge: "Papers",
    badgeColor: "bg-orange-100 text-orange-700",
    count: "100+ papers",
  },
  {
    slug: "dsa-notes",
    label: "DSA Notes",
    description: "Curated Data Structures & Algorithms notes covering arrays, trees, graphs, DP and more — written for placement exams.",
    icon: Code2,
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "Technical",
    badgeColor: "bg-blue-100 text-blue-700",
    count: "50+ topics",
  },
  {
    slug: "hackathon",
    label: "AI Hackathon",
    description: "Compete in 48-hour MERN stack hackathons. Form a team of 2–4, pick a problem statement, build and submit your project — scored by AI for code quality and relevance.",
    icon: Rocket,
    color: "from-violet-500 to-indigo-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    badge: "Hackathon",
    badgeColor: "bg-violet-100 text-violet-700",
    count: "Join & compete",
  },
  {
    slug: "cs-fundamentals",
    label: "CS Fundamentals",
    description: "Core computer science theory — OS, DBMS, Computer Networks, OOP, and System Design explained for interview rounds.",
    icon: BookOpen,
    color: "from-green-500 to-emerald-700",
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badge: "Theory",
    badgeColor: "bg-green-100 text-green-700",
    count: "40+ topics",
  },
  {
    slug: "blog",
    label: "Blog",
    description: "Career tips, placement strategies, company-specific preparation guides, and insights from engineers across the industry.",
    icon: PenLine,
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    badge: "Insights",
    badgeColor: "bg-pink-100 text-pink-700",
    count: "80+ articles",
  },
];

const STATS = [
  { value: "10,000+", label: "Students Helped", icon: Users },
  { value: "500+", label: "Interview Experiences", icon: MessageSquare },
  { value: "150+", label: "DSA & CS Notes", icon: BookOpen },
  { value: "4.8★", label: "Average Rating", icon: Star },
];

export default function ResourcesHubPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-300 text-xs font-semibold">Free Resources</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
              Everything you need to
              <span className="text-blue-400"> crack placements</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              From interview experiences to DSA notes, company papers to CS fundamentals — all
              in one place, curated by our team and the BeyondBasic community.
            </p>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Browse by Category</h2>
          <p className="text-slate-500">Pick a category to dive deep into curated content.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={cat.slug === "hackathon" ? "/hackathon" : `/resources/${cat.slug}`}
                className={`group relative bg-white rounded-2xl border ${cat.border} p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${cat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>

                {/* Gradient bar */}
                <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${cat.color} mb-4 group-hover:w-20 transition-all duration-300`} />

                <h3 className="text-lg font-black text-slate-900 mb-2">{cat.label}</h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-5">{cat.description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${cat.iconColor}`}>{cat.count}</span>
                  <div className={`flex items-center gap-1 text-sm font-bold ${cat.iconColor} group-hover:gap-2 transition-all`}>
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Contribute your experience</h3>
            <p className="text-blue-100">
              Share your placement interview story and help the next batch of students.
            </p>
          </div>
          <Link
            to="/resources/interview-experiences"
            className="flex-shrink-0 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Share Experience
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
