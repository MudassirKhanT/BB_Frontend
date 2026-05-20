import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle, X, Send, Loader2, Zap, ChevronDown,
  RotateCcw, Sparkles,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Message {
  role: "user" | "model";
  text: string;
}

const SUGGESTIONS = [
  "What features does BeyondBasic offer?",
  "How do I prepare for placements?",
  "Tell me about Mock Assessments",
  "How does Resume Analyzer work?",
  "Which companies are available for prep?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

function parseMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-slate-100 text-primary px-1 rounded text-xs font-mono'>$1</code>")
    .replace(/^### (.+)$/gm, "<p class='font-bold text-slate-800 mt-2 mb-0.5 text-sm'>$1</p>")
    .replace(/^## (.+)$/gm,  "<p class='font-bold text-slate-900 mt-2 mb-1'>$1</p>")
    .replace(/^- (.+)$/gm,   "<li class='ml-3 list-disc text-slate-700'>$1</li>")
    .replace(/(<li[\s\S]*?<\/li>)+/g, (m) => `<ul class='space-y-0.5 my-1'>${m}</ul>`)
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default function ChatBot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [minimised, setMinimised] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimised]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMsg: Message = { role: "user", text: trimmed };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const history = updated.slice(0, -1).map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, I'm having trouble connecting right now. Please try again in a moment!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const reset = () => { setMessages([]); setInput(""); };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .chat-window { animation: slideUp 0.25s ease-out forwards; }
        .chat-btn-pop { animation: popIn 0.3s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="chat-btn-pop fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 hover:scale-110 active:scale-95 transition-transform"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`chat-window fixed z-50 flex flex-col rounded-2xl shadow-2xl border border-slate-200/80 bg-white overflow-hidden transition-all duration-300 ${
            minimised
              ? "w-72 h-14 bottom-4 right-4"
              : "bottom-4 right-4 left-4 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[390px] h-[min(580px,calc(100vh-2rem))]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-tight">BeyondBasic AI</p>
                <p className="text-[10px] text-white/70 leading-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  Powered by Gemini 2.5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && !minimised && (
                <button onClick={reset} title="Clear chat"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setMinimised((v) => !v)} title={minimised ? "Expand" : "Minimise"}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${minimised ? "rotate-180" : ""}`} />
              </button>
              <button onClick={() => { setOpen(false); setMinimised(false); }} title="Close"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
                {/* Welcome state */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center text-center pt-4 pb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center mb-3 shadow-sm">
                      <Sparkles className="w-7 h-7 text-violet-600" />
                    </div>
                    <p className="font-black text-slate-900 text-base">Hey there! 👋</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-[260px]">
                      I'm your BeyondBasic guide. Ask me anything about the platform, or pick a suggestion below!
                    </p>
                    <div className="mt-4 flex flex-col gap-2 w-full">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => sendMessage(s)}
                          className="text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {m.role === "model" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                        <Zap className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-tr-sm"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm"
                      }`}
                    >
                      {m.role === "model" ? (
                        <span dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                      <Zap className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick links bar (only when messages exist) */}
              {messages.length > 0 && (
                <div className="flex gap-1.5 px-3 py-1.5 bg-white border-t border-slate-100 overflow-x-auto scrollbar-hide flex-shrink-0">
                  {[
                    { label: "Resume AI", to: "/resume-analyzer" },
                    { label: "Mock Tests", to: "/mock-assessments" },
                    { label: "Company Prep", to: "/company-prep" },
                    { label: "Courses", to: "/courses" },
                  ].map(({ label, to }) => (
                    <Link key={to} to={to}
                      className="whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0">
                      {label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-slate-100 flex-shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder-slate-400 disabled:opacity-60"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center text-white shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
