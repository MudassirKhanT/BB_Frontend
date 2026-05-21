import { Zap, Brain, BarChart2, Code2, MessageSquare, Trophy } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Adaptive Learning",
    description:
      "Our AI watches how you learn and adjusts content difficulty, pacing, and examples to match your style in real time.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: Code2,
    title: "In-Browser Code Environments",
    description:
      "No setup required. Write, run, and test real code right inside your browser with full terminal access.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: BarChart2,
    title: "Progress Dashboards",
    description:
      "Visual skill maps show exactly where you stand, what to tackle next, and how far you've come.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Trophy,
    title: "Interview Simulation",
    description:
      "Practice whiteboard questions with real-time AI feedback on time complexity, edge cases, and communication.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: MessageSquare,
    title: "Expert Community",
    description:
      "Ask questions, share solutions, and learn alongside 2.9M developers. Expert instructors respond directly.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Zap,
    title: "Learn in 15-min Sprints",
    description:
      "Bite-sized lessons designed around your busy schedule. Make meaningful progress every day, even with limited time.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
];

export default function WhyUs() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 sm:mb-4">
            Everything you need to level up
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto">
            Built by engineers, for engineers — every feature is designed to get you job-ready faster.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className={`rounded-2xl bg-white p-6 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 group`}
            >
              <div
                className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
              >
                <Icon size={20} className={color} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
