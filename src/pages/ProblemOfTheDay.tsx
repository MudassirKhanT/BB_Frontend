import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import { Calendar, Code2, Database, Zap, ChevronRight } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  type: "coding" | "sql";
  description: string;
  topicTag: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
}

interface ProblemOfTheDayData {
  codingProblem: Problem | null;
  sqlProblem: Problem | null;
  date: string;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Hard: "bg-red-100 text-red-800 border-red-300",
};

export default function ProblemOfTheDayPage() {
  const [potd, setPotd] = useState<ProblemOfTheDayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPotd = async () => {
      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE}/problems/potd`);

        if (!response.ok) {
          throw new Error("Failed to fetch Problem of the Day");
        }

        const data = await response.json();
        setPotd(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPotd();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">Loading today's problems...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
            <Link to="/dashboard" className="text-primary hover:underline font-semibold">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900">Problem of the Day</h1>
              <div className="flex items-center gap-2 text-slate-500 mt-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(potd?.date || "").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
          <p className="text-slate-600 text-base sm:text-lg">Challenge yourself with today's curated selection of coding and SQL problems. Master both skills in one day!</p>
        </div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {/* Coding Problem */}
          {potd?.codingProblem ? (
            <ProblemCard problem={potd.codingProblem} icon={<Code2 className="w-6 h-6" />} label="Coding Challenge" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-96">
              <p className="text-slate-400 text-center">No coding problem available today</p>
            </div>
          )}

          {/* SQL Problem */}
          {potd?.sqlProblem ? (
            <ProblemCard problem={potd.sqlProblem} icon={<Database className="w-6 h-6" />} label="SQL Challenge" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-96">
              <p className="text-slate-400 text-center">No SQL problem available today</p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Today's Challenge Tips</h2>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold shrink-0">1</span>
              <span>Start with the easier problem to build momentum and confidence</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold shrink-0">2</span>
              <span>Read the problem statement carefully and understand all examples</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold shrink-0">3</span>
              <span>Test your solution with edge cases before submitting</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold shrink-0">4</span>
              <span>Come back tomorrow for new challenges and track your progress</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ProblemCardProps {
  problem: Problem;
  icon: React.ReactNode;
  label: string;
}

function ProblemCard({ problem, icon, label }: ProblemCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
          <span className="text-sm font-bold text-primary uppercase tracking-wide">{label}</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900">{problem.title}</h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${DIFF_COLORS[problem.difficulty] || "bg-slate-100 text-slate-800 border-slate-300"}`}>{problem.difficulty}</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-300">{problem.topicTag}</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-300">{problem.type === "coding" ? "Algorithm" : "Database"}</span>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-2">Description</h4>
          <p className="text-slate-600 line-clamp-3">{problem.description}</p>
        </div>

        {/* Examples Preview */}
        {problem.examples && problem.examples.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">Example</h4>
            <div className="bg-slate-900 rounded-lg p-4 text-slate-100 font-mono text-xs space-y-2">
              <div>
                <span className="text-blue-400">Input:</span> <span>{problem.examples[0]?.input?.substring(0, 50)}...</span>
              </div>
              <div>
                <span className="text-green-400">Output:</span> <span>{problem.examples[0]?.output?.substring(0, 50)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link to={`/problems/${problem.slug}`} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors">
          Solve Now
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
