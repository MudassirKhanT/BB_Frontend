import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { roadmapApi } from "@/lib/api";
import {
  Sparkles, ArrowRight, CheckCircle2, Loader2, Target, Clock,
  Brain, Lightbulb, RefreshCw, ChevronDown, ChevronUp, BookOpen,
  Calendar, Star, BarChart3, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface DailyPlanItem {
  day: string;
  topic: string;
  tasks: string[];
  estimatedHours: number;
}

interface Phase {
  phaseNumber: number;
  phaseName: string;
  duration: string;
  focusAreas: string[];
  dailyPlan: DailyPlanItem[];
  milestone: string;
}

interface Roadmap {
  title: string;
  summary: string;
  totalDuration: string;
  weeklyHoursRequired: number;
  phases: Phase[];
  companySpecificTopics: string[];
  mockTestSchedule: string[];
  keyTips: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const COMPANY_TYPES = [
  "Service-based (TCS, Infosys, Wipro…)",
  "Product-based (Amazon, Microsoft…)",
  "Both",
];

const TIMELINES = ["< 1 month", "1–2 months", "2–3 months", "3+ months"];

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const PHASE_COLORS: Record<number, { bg: string; border: string; badge: string; dot: string }> = {
  1: { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  2: { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  3: { bg: "bg-emerald-50",border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
  4: { bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-500" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PhaseCard({ phase }: { phase: Phase }) {
  const [open, setOpen] = useState(phase.phaseNumber === 1);
  const c = PHASE_COLORS[phase.phaseNumber] ?? PHASE_COLORS[1];

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${c.dot} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
            {phase.phaseNumber}
          </div>
          <div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${c.badge.split(" ")[1]} mb-0.5`}>
              <span className={`inline-block px-2.5 py-0.5 rounded-full ${c.badge}`}>{phase.duration}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">{phase.phaseName}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex flex-wrap gap-1.5">
            {phase.focusAreas.slice(0, 3).map((area) => (
              <span key={area} className="text-xs font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                {area}
              </span>
            ))}
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-5">
          {/* Focus areas (mobile) */}
          <div className="sm:hidden flex flex-wrap gap-1.5">
            {phase.focusAreas.map((area) => (
              <span key={area} className="text-xs font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                {area}
              </span>
            ))}
          </div>

          {/* Daily plan */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Daily Plan
            </h4>
            <div className="space-y-2.5">
              {phase.dailyPlan.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.day}</span>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{item.topic}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 flex-shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3 h-3" /> {item.estimatedHours}h
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {item.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone */}
          <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4 border border-slate-200">
            <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">Phase Milestone</p>
              <p className="text-sm font-semibold text-slate-700">{phase.milestone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoadmapGeneratorPage() {
  const [searchParams] = useSearchParams();

  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [timeline, setTimeline] = useState(searchParams.get("timeline") ?? "");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate if query params are present
  useEffect(() => {
    if (searchParams.get("company") && searchParams.get("timeline")) {
      handleGenerate(searchParams.get("company")!, searchParams.get("timeline")!, "Beginner");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(
    companyVal = company,
    timelineVal = timeline,
    skillVal = skillLevel,
  ) {
    if (!companyVal || !timelineVal) return;
    setLoading(true);
    setError(null);
    setRoadmap(null);
    try {
      const data = await roadmapApi.generate({
        companyType: companyVal,
        timeline: timelineVal,
        skillLevel: skillVal,
      });
      setRoadmap(data.roadmap as Roadmap);
      setTimeout(() => {
        document.getElementById("roadmap-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = !!company && !!timeline && !loading;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Hero / Form ── */}
      <section className="bg-slate-900 relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[140px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-violet-500/15 blur-[100px] translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center gap-12 lg:gap-16">
          {/* Left copy */}
          <div className="flex-1 text-white">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={13} /> AI-Powered
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-5">
              Get your personalized
              <br />
              <span className="text-primary">placement roadmap</span>
              <br />
              in 30 seconds.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-lg">
              Tell us your target and timeline. Our AI maps out exactly what to study,
              when to study it, and which mock tests to take — so you&apos;re never guessing.
            </p>
            <ul className="space-y-3">
              {[
                "Day-by-day study plan built for your timeline",
                "Company-specific topics mapped to your goal",
                "Weak area detection from your skill test",
                "Adjusts automatically as you progress",
              ].map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                  <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Right form card */}
          <div className="w-full lg:max-w-sm bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl flex-shrink-0">
            <h2 className="text-lg font-black text-slate-900 mb-1">Build my roadmap</h2>
            <p className="text-sm text-slate-400 font-medium mb-6">Free — no signup required</p>

            <div className="space-y-5">
              {/* Company type */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Target companies
                </label>
                <div className="flex flex-col gap-2">
                  {COMPANY_TYPES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCompany(c)}
                      className={`text-left text-sm font-semibold px-4 py-2.5 rounded-xl border-2 transition-all ${
                        company === c
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Time until placement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMELINES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeline(t)}
                      className={`text-sm font-semibold px-3 py-2.5 rounded-xl border-2 transition-all ${
                        timeline === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill level */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Current skill level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SKILL_LEVELS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkillLevel(s)}
                      className={`text-sm font-semibold px-3 py-2.5 rounded-xl border-2 transition-all ${
                        skillLevel === s
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleGenerate()}
                disabled={!canGenerate}
                className={`w-full h-12 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all ${
                  canGenerate
                    ? "bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-px active:translate-y-0 group"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating your roadmap…
                  </>
                ) : (
                  <>
                    Generate my plan
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 font-medium">
                No signup needed to preview your roadmap
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Loading state ── */}
      {loading && (
        <section className="py-20 px-4 flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">AI is crafting your roadmap…</p>
            <p className="text-sm text-slate-500 mt-1">Analysing your target companies and timeline</p>
          </div>
          <div className="flex gap-2">
            {["Analysing companies", "Mapping topics", "Building schedule"].map((step, i) => (
              <span key={step} className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                {step}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <section className="py-10 px-4 max-w-2xl mx-auto w-full">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-700 text-sm">Generation failed</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
              <button
                onClick={() => handleGenerate()}
                className="mt-3 text-xs font-black text-red-700 flex items-center gap-1.5 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Result ── */}
      {roadmap && !loading && (
        <section id="roadmap-result" className="py-14 sm:py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-widest mb-3">
                  <Sparkles size={12} /> Your Personalized Roadmap
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{roadmap.title}</h2>
                <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">{roadmap.summary}</p>
              </div>
              <button
                onClick={() => handleGenerate()}
                className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-primary transition-colors flex-shrink-0 bg-white border border-slate-200 px-4 py-2.5 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Clock,     label: "Duration",       value: roadmap.totalDuration },
                { icon: BarChart3, label: "Hours/week",      value: `${roadmap.weeklyHoursRequired}h` },
                { icon: BookOpen,  label: "Phases",          value: `${roadmap.phases.length} phases` },
                { icon: Target,    label: "Company topics",  value: `${roadmap.companySpecificTopics.length} topics` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Phases */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Study Phases
              </h3>
              <div className="space-y-3">
                {roadmap.phases.map((phase) => (
                  <PhaseCard key={phase.phaseNumber} phase={phase} />
                ))}
              </div>
            </div>

            {/* Company topics + mock schedule side-by-side */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Company-Specific Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {roadmap.companySpecificTopics.map((topic) => (
                    <span key={topic} className="text-xs font-semibold bg-primary/8 text-primary border border-primary/20 px-3 py-1.5 rounded-lg">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Mock Test Schedule
                </h3>
                <ul className="space-y-2.5">
                  {roadmap.mockTestSchedule.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key tips */}
            <div className="bg-slate-900 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5" /> Key Tips for Success
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {roadmap.keyTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                    <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 font-medium mb-4">
                Ready to follow this roadmap? Start with the courses on BeyondBasic.
              </p>
              <a
                href="/courses"
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-black px-6 py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-px transition-all"
              >
                Explore Courses <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
