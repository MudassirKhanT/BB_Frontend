import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COMPANY_TYPES = ["Service-based (TCS, Infosys, Wipro…)", "Product-based (Amazon, Microsoft…)", "Both"];
const TIMELINES = ["< 1 month", "1–2 months", "2–3 months", "3+ months"];

const PERKS = [
  "Day-by-day study plan built for your timeline",
  "Company-specific topics mapped to your goal",
  "Weak area detection from your skill test",
  "Adjusts automatically as you progress",
];

export default function RoadmapCTA() {
  const [company, setCompany] = useState("");
  const [timeline, setTimeline] = useState("");
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="relative bg-slate-900 rounded-3xl sm:rounded-[2.5rem] overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/25 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-violet-500/20 blur-[100px] translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 p-7 sm:p-10 md:p-16 flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-14">

            {/* Left */}
            <div className="flex-1 text-white">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles size={13} />
                AI-Powered
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
                Get your personalized
                <br />
                <span className="text-primary">placement roadmap</span>
                <br />
                in 30 seconds.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-7 max-w-lg">
                Tell us your target and timeline. Our AI maps out exactly what to study,
                when to study it, and which mock tests to take — so you&apos;re never guessing.
              </p>
              <ul className="space-y-2.5">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — form */}
            <div className="w-full lg:max-w-sm bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900 mb-1">Build my roadmap</h3>
              <p className="text-sm text-slate-400 font-medium mb-6">Free with every enrollment</p>

              <div className="space-y-4">
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

                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (company) params.set("company", company);
                    if (timeline) params.set("timeline", timeline);
                    navigate(`/roadmap-generator${params.toString() ? `?${params.toString()}` : ""}`);
                  }}
                  className="w-full h-12 rounded-xl bg-primary text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-px active:translate-y-0 transition-all group"
                >
                  Generate my plan
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <p className="text-center text-xs text-slate-400 font-medium">
                  No signup needed to preview your roadmap
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
