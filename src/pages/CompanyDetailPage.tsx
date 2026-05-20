import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, MapPin, DollarSign, Users, Target, CheckCircle2, ChevronRight, Briefcase, Clock, ArrowRight, BadgeCheck, BookOpen, Brain, Zap } from "lucide-react";
import { companyApi } from "@/lib/api";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

interface Round {
  name: string;
  description: string;
  duration: string;
  tips: string;
  order: number;
}

interface HiringDetails {
  ctc: string;
  roles: string[];
  eligibility: string;
  locations: string[];
  bond: string;
  selectionRate: string;
}

interface Company {
  _id: string;
  name: string;
  slug: string;
  type: string;
  color: string;
  badge: string;
  badgeColor: string;
  website: string;
  description: string;
  overview: string;
  hiringProcess: string;
  hiringDetails: HiringDetails;
  rounds: Round[];
}

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-black text-slate-900 mt-6 mb-2 first:mt-0">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-800 mt-4 mb-1.5">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("**Stage")) {
      const content = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      elements.push(<p key={i} className="text-sm text-slate-700 mb-1" dangerouslySetInnerHTML={{ __html: content }} />);
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 mb-1">
          <CheckCircle2 size={13} className="text-primary flex-shrink-0 mt-0.5" />
          <span>{line.slice(2)}</span>
        </div>,
      );
    } else if (line.trim() === "" || line === "---") {
      if (line === "---") elements.push(<hr key={i} className="my-4 border-slate-100" />);
      else elements.push(<div key={i} className="h-1" />);
    } else {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      elements.push(<p key={i} className="text-sm text-slate-600 mb-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
    }
    i++;
  }
  return elements;
}

export default function CompanyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRound, setActiveRound] = useState(0);

  useEffect(() => {
    if (!slug) return;
    companyApi
      .getBySlug(slug)
      .then((data) => setCompany(data))
      .catch(() => setError("Company not found or unavailable."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-sm">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Company not found</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <Link to="/company-prep" className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all">
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const sortedRounds = [...company.rounds].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Company Hero Banner */}
      <div className={`${company.color} text-white`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest border rounded-full px-3 py-1 ${company.badgeColor}`}>{company.badge}</span>
                <span className="text-white/70 text-xs font-semibold border border-white/30 rounded-full px-2.5 py-1">{company.type}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-2">{company.name}</h1>
              <p className="text-white/80 text-sm sm:text-base max-w-xl">{company.description}</p>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white/70 text-xs font-semibold mt-3 hover:text-white transition-colors">
                  <ExternalLink size={12} /> {company.website.replace("https://", "").replace("www.", "")}
                </a>
              )}
            </div>
            <div className="flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-sm min-w-[180px]">
                <div className="font-black text-lg mb-1">{sortedRounds.length} Rounds</div>
                <div className="text-white/70 text-xs font-medium">In the hiring process</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {company.overview && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" /> Company Overview
                </h2>
                <div>{renderMarkdown(company.overview)}</div>
              </div>
            )}

            {/* Hiring Process */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <Target size={16} className="text-primary" /> Hiring Process
              </h2>
              <div>{renderMarkdown(company.hiringProcess)}</div>
            </div>

            {/* Rounds Detail */}
            {sortedRounds.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2">
                  <Brain size={16} className="text-primary" /> Round-by-Round Breakdown
                </h2>

                {/* Round tabs */}
                <div className="flex gap-2 flex-wrap mb-6">
                  {sortedRounds.map((_round, idx) => (
                    <button key={idx} onClick={() => setActiveRound(idx)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeRound === idx ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"}`}>
                      Round {idx + 1}
                    </button>
                  ))}
                </div>

                {sortedRounds[activeRound] && (
                  <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-black text-slate-900 text-base">{sortedRounds[activeRound].name}</h3>
                      {sortedRounds[activeRound].duration && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-1">
                          <Clock size={11} /> {sortedRounds[activeRound].duration}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{sortedRounds[activeRound].description}</p>
                    {sortedRounds[activeRound].tips && (
                      <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
                        <div className="text-xs font-black text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <BadgeCheck size={12} /> Pro Tips
                        </div>
                        <p className="text-sm text-slate-700">{sortedRounds[activeRound].tips}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Prepare Now CTA */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Zap size={22} className="text-primary" />
                </div>
                <h3 className="font-black text-slate-900 text-base mb-1">Ready to crack {company.name}?</h3>
                <p className="text-slate-500 text-xs">DSA, Aptitude, LLD, HLD, Mock Tests & more</p>
              </div>
              <Link to={`/company-prep/${slug}/prepare`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-px active:translate-y-0">
                Prepare Now <ArrowRight size={15} />
              </Link>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {["Aptitude", "DSA", "Interviews"].map((tag) => (
                  <div key={tag} className="bg-slate-50 rounded-lg py-2 text-xs font-bold text-slate-600">
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring Details */}
            {company.hiringDetails && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <Briefcase size={14} className="text-primary" /> Hiring Details
                </h3>
                <div className="space-y-4">
                  {company.hiringDetails.ctc && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        <DollarSign size={10} /> Package
                      </div>
                      <div className="text-xs font-semibold text-slate-700 leading-relaxed">{company.hiringDetails.ctc}</div>
                    </div>
                  )}
                  {company.hiringDetails.roles?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        <Briefcase size={10} /> Roles
                      </div>
                      <div className="space-y-1">
                        {company.hiringDetails.roles.map((role, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                            <ChevronRight size={11} className="text-primary" /> {role}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {company.hiringDetails.eligibility && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        <BadgeCheck size={10} /> Eligibility
                      </div>
                      <div className="text-xs text-slate-700">{company.hiringDetails.eligibility}</div>
                    </div>
                  )}
                  {company.hiringDetails.locations?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        <MapPin size={10} /> Locations
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {company.hiringDetails.locations.map((loc) => (
                          <span key={loc} className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {company.hiringDetails.selectionRate && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        <Users size={10} /> Selection Rate
                      </div>
                      <div className="text-xs font-semibold text-slate-700">{company.hiringDetails.selectionRate}</div>
                    </div>
                  )}
                  {company.hiringDetails.bond && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        <CheckCircle2 size={10} className="text-emerald-500" /> Bond
                      </div>
                      <div className="text-xs text-emerald-700 font-semibold">{company.hiringDetails.bond}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-black text-slate-900 text-sm mb-3">Preparation Areas</h3>
              <div className="space-y-2">
                {[
                  { label: "Aptitude & Reasoning", icon: "🧮" },
                  { label: "DSA & Coding", icon: "💻" },
                  { label: "Communication Skills", icon: "🗣️" },
                  { label: "Low Level Design", icon: "🏗️" },
                  { label: "High Level Design", icon: "🌐" },
                  { label: "Interview Experiences", icon: "💬" },
                ].map(({ label, icon }) => (
                  <Link key={label} to={`/company-prep/${slug}/prepare`} className="flex items-center gap-2.5 text-sm text-slate-600 font-medium hover:text-primary transition-colors py-1">
                    <span>{icon}</span> {label}
                    <ChevronRight size={13} className="ml-auto text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
