import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, ChevronUp, Sparkles, Target, Zap,
  TrendingUp, X, ClipboardPaste,
} from "lucide-react";

// Point to the locally installed worker — version always matches
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Improvement {
  category: string;
  issue: string;
  suggestion: string;
}

interface AnalysisResult {
  atsScore: number;
  scoreBreakdown: {
    formatting: number;
    keywords: number;
    experience: number;
    education: number;
    skills: number;
  };
  summary: string;
  strengths: string[];
  improvements: Improvement[];
  keywords: { present: string[]; missing: string[] };
  verdict: string;
}

// ── Extract text from PDF in the browser ─────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str: string }>)
      .filter((item) => typeof item.str === "string")
      .map((item) => item.str)
      .join(" ");
    pages.push(pageText);
  }
  return pages.join("\n\n");
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="68" cy="68" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-black" style={{ color }}>{score}</p>
        <p className="text-xs font-bold text-slate-400 -mt-1">/ 100</p>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResumeAnalyzerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false); // PDF text extraction progress
  const [extractedText, setExtractedText] = useState(""); // text extracted from PDF
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<Record<number, boolean>>({});

  const isLoggedIn = !!localStorage.getItem("token");

  const handleFile = async (f: File) => {
    if (!["application/pdf", "text/plain"].includes(f.type)) {
      setError("Only PDF or TXT files are supported.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }
    setFile(f);
    setError("");
    setExtractedText("");

    if (f.type === "application/pdf") {
      setExtracting(true);
      try {
        const text = await extractTextFromPDF(f);
        if (!text.trim()) {
          setError("No readable text found in this PDF. It may be a scanned image — please paste the text instead.");
          setFile(null);
        } else {
          setExtractedText(text);
        }
      } catch (e: unknown) {
        setError("Could not read this PDF. Please paste your resume text instead.");
        setFile(null);
      } finally {
        setExtracting(false);
      }
    } else {
      // Plain text file — read directly
      const text = await f.text();
      setExtractedText(text);
    }
  };

  const handleAnalyze = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    setError("");
    setResult(null);
    setLoading(true);

    const resumeText = mode === "upload" ? extractedText : pasteText;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/resume/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Analysis failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = mode === "upload"
    ? (extractedText.length >= 100 && !extracting)
    : pasteText.trim().length >= 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-violet-900 text-white pt-16 pb-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Powered by Gemini AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Resume Analyzer</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Get your ATS score instantly and know exactly what to fix to land more interviews.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {!result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            {/* Mode toggle */}
            <div className="flex gap-2 bg-slate-100 rounded-xl p-1 mb-6">
              {(["upload", "paste"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setFile(null); setExtractedText(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                  {m === "upload" ? <Upload className="w-4 h-4" /> : <ClipboardPaste className="w-4 h-4" />}
                  {m === "upload" ? "Upload PDF" : "Paste Text"}
                </button>
              ))}
            </div>

            {mode === "upload" ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary hover:bg-slate-50"}`}
                onClick={() => !extracting && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                {extracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="font-semibold text-slate-600">Reading your PDF...</p>
                    <p className="text-sm text-slate-400">Extracting text from all pages</p>
                  </div>
                ) : file && extractedText ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-400">{extractedText.length.toLocaleString()} characters extracted</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); setExtractedText(""); }}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">Drop your resume here or click to browse</p>
                      <p className="text-sm text-slate-400 mt-1">Supports PDF and TXT · Max 5 MB</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your resume text here (copy-paste from your PDF/DOCX)..."
                  rows={12}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none leading-relaxed" />
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {pasteText.length} characters {pasteText.length < 100 && <span className="text-orange-500">(min 100)</span>}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button onClick={handleAnalyze} disabled={loading || !canAnalyze}
              className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing your resume...</>
                : <><Sparkles className="w-5 h-5" /> Analyze Resume</>}
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="space-y-5">
            <button onClick={() => { setResult(null); setFile(null); setExtractedText(""); setPasteText(""); }}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors">
              <Upload className="w-4 h-4" /> Analyze another resume
            </button>

            {/* Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={result.atsScore} />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-black text-slate-900 mb-1">ATS Score</h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{result.summary}</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border ${
                    result.atsScore >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                    result.atsScore >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {result.atsScore >= 75 ? <CheckCircle2 className="w-4 h-4" /> :
                     result.atsScore >= 50 ? <AlertTriangle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {result.verdict}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Score Breakdown
              </h3>
              <div className="space-y-3">
                <BreakdownBar label="Formatting" value={result.scoreBreakdown.formatting} max={20} />
                <BreakdownBar label="Keywords"   value={result.scoreBreakdown.keywords}   max={25} />
                <BreakdownBar label="Experience" value={result.scoreBreakdown.experience} max={25} />
                <BreakdownBar label="Education"  value={result.scoreBreakdown.education}  max={15} />
                <BreakdownBar label="Skills"     value={result.scoreBreakdown.skills}     max={15} />
              </div>
            </div>

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {result.improvements?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" /> What to Improve
                </h3>
                <div className="space-y-3">
                  {result.improvements.map((imp, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                        onClick={() => setExpandedIdx((p) => ({ ...p, [i]: !p[i] }))}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                            {imp.category}
                          </span>
                          <span className="text-sm font-semibold text-slate-700 truncate">{imp.issue}</span>
                        </div>
                        {expandedIdx[i] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                      {expandedIdx[i] && (
                        <div className="px-4 py-3 bg-white">
                          <p className="text-sm text-slate-600 flex items-start gap-2">
                            <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />{imp.suggestion}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {(result.keywords?.present?.length > 0 || result.keywords?.missing?.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" /> Keywords
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {result.keywords.present?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present ({result.keywords.present.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords.present.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.keywords.missing?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Missing ({result.keywords.missing.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords.missing.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
