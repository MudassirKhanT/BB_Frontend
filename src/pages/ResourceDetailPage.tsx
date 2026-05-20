import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Clock, Eye, Tag, User, Download, ExternalLink,
  BookOpen, Code2, FileText, PenLine, Loader2, AlertCircle,
  Pencil, Trash2, X, List, ChevronRight, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { resourceApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Resource {
  _id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  content: string;
  coverColor: string;
  tags: string[];
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  readTime: number;
  authorName: string;
  views: number;
  likes: number;
  company: string;
  fileUrl: string;
  videoUrl: string;
  isPublished: boolean;
  createdAt: string;
}

interface Heading { id: string; text: string; level: number }

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; slug: string }> = {
  "dsa-note":       { label: "DSA Notes",        icon: Code2,     slug: "dsa-notes" },
  "company-paper":  { label: "Company Papers",   icon: FileText,  slug: "company-papers" },
  "cs-fundamental": { label: "CS Fundamentals",  icon: BookOpen,  slug: "cs-fundamentals" },
  "blog":           { label: "Blog",             icon: PenLine,   slug: "blog" },
};

const DIFF_COLOR: Record<string, string> = {
  Beginner:     "bg-green-50 text-green-700 border-green-200",
  Intermediate: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Advanced:     "bg-red-50 text-red-700 border-red-200",
};

// ─── Extract headings from markdown ──────────────────────────────────────────
function extractHeadings(content: string): Heading[] {
  return content.split("\n")
    .map((line) => {
      const h3 = line.match(/^### (.+)/);
      const h2 = line.match(/^## (.+)/);
      const h1 = line.match(/^# (.+)/);
      if (h1) return { text: h1[1], level: 1, id: h1[1].toLowerCase().replace(/[^a-z0-9]+/g, "-") };
      if (h2) return { text: h2[1], level: 2, id: h2[1].toLowerCase().replace(/[^a-z0-9]+/g, "-") };
      if (h3) return { text: h3[1], level: 3, id: h3[1].toLowerCase().replace(/[^a-z0-9]+/g, "-") };
      return null;
    })
    .filter(Boolean) as Heading[];
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={idx} className="font-bold text-slate-900">{p.slice(2, -2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*"))
        return <em key={idx} className="italic">{p.slice(1, -1)}</em>;
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={idx} className="px-1.5 py-0.5 bg-slate-100 text-blue-700 rounded text-[0.85em] font-mono border border-slate-200">{p.slice(1, -1)}</code>;
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code block — light theme
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`code-${i}`} className="rounded-xl overflow-hidden shadow-sm border border-slate-200 my-5">
          <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            {lang && <span className="text-slate-500 text-xs font-mono uppercase tracking-wide">{lang}</span>}
          </div>
          <div className="bg-slate-50 overflow-x-auto">
            <pre className="p-5 text-sm font-mono leading-relaxed text-slate-800 whitespace-pre">
              {codeLines.join("\n")}
            </pre>
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Table
    if (line.startsWith("|") && lines[i + 1]?.startsWith("|---")) {
      const headers = line.split("|").filter((c) => c.trim()).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter((c) => c.trim()).map((c) => c.trim()));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm my-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {headers.map((h, hi) => (
                  <th key={hi} className="px-4 py-3 text-left font-bold text-slate-700 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-slate-600 border-t border-slate-100">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-3 pr-4 rounded-r-xl my-4 text-blue-800 text-sm leading-relaxed italic">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Headings (with anchor ids)
    const h3Match = line.match(/^### (.+)/);
    const h2Match = line.match(/^## (.+)/);
    const h1Match = line.match(/^# (.+)/);
    if (h1Match) {
      const id = h1Match[1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(<h1 id={id} key={`h1-${i}`} className="text-3xl font-black text-slate-900 leading-tight mt-8 mb-4 pb-3 border-b-2 border-blue-100 scroll-mt-20">{renderInline(h1Match[1])}</h1>);
      i++; continue;
    }
    if (h2Match) {
      const id = h2Match[1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(<h2 id={id} key={`h2-${i}`} className="text-2xl font-black text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-200 scroll-mt-20">{renderInline(h2Match[1])}</h2>);
      i++; continue;
    }
    if (h3Match) {
      const id = h3Match[1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(<h3 id={id} key={`h3-${i}`} className="text-lg font-bold text-slate-800 mt-6 mb-3 scroll-mt-20">{renderInline(h3Match[1])}</h3>);
      i++; continue;
    }

    // HR
    if (line.trim() === "---") {
      elements.push(<hr key={`hr-${i}`} className="border-slate-200 my-6" />);
      i++; continue;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2 my-3 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2.5 text-slate-600 text-[15px]">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && new RegExp(`^${num}\\. `).test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++; num++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 my-3 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2.5 text-slate-600 text-[15px]">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{ii + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      i++; continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-slate-600 leading-relaxed text-[15px]">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResourceDetailPage() {
  const { type: typeSlug = "", slug = "" } = useParams<{ type: string; slug: string }>();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role === "admin"; }
    catch { return false; }
  })();

  useEffect(() => {
    setLoading(true);
    resourceApi.getBySlug(slug)
      .then((data: Resource) => setResource(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Track active section as user scrolls
  useEffect(() => {
    if (!resource?.content) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    const headingEls = contentRef.current?.querySelectorAll("h1[id],h2[id],h3[id]") || [];
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [resource]);

  const handleDelete = async () => {
    if (!resource || !confirm("Delete this resource permanently?")) return;
    try {
      await resourceApi.delete(resource._id);
      navigate(`/resources/${typeSlug}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold text-lg mb-1">Resource not found</p>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  const typeInfo = TYPE_LABELS[resource.type] || { label: "Resource", icon: BookOpen, slug: typeSlug };
  const TypeIcon = typeInfo.icon;
  const headings = extractHeadings(resource.content || "");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Edit modal */}
      {showEdit && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-lg">Edit Resource</h3>
              <button onClick={() => setShowEdit(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-slate-500 text-sm">Use the resource list page admin form to edit full content.</p>
            <Button className="mt-4" onClick={() => navigate(`/resources/${typeSlug}`)}>
              Go to list page
            </Button>
          </div>
        </div>
      )}

      {/* Compact header banner */}
      <div className={`bg-gradient-to-r ${resource.coverColor || "from-blue-600 to-blue-800"} relative overflow-hidden flex-shrink-0`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <button onClick={() => navigate(`/resources/${typeSlug}`)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> {typeInfo.label}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/70 text-sm truncate max-w-xs">{resource.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg flex-shrink-0">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {resource.category && <p className="text-white/70 text-xs font-semibold mb-0.5">{resource.category}</p>}
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{resource.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-1">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{resource.authorName}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{resource.readTime} min read</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{resource.views} views</span>
                <Badge className={`text-[10px] border ${DIFF_COLOR[resource.difficulty]}`}>{resource.difficulty}</Badge>
              </div>
            </div>
            {/* Mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body: left sidebar + right content */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? "w-64 xl:w-72" : "w-0"
        } flex-shrink-0 bg-white border-r border-slate-200 overflow-hidden transition-all duration-300 sticky top-0 h-[calc(100vh-4rem)] flex flex-col
          absolute inset-y-0 left-0 z-30 md:relative`}>
          <div className="flex-1 overflow-y-auto py-5 px-4">
            {/* TOC */}
            {headings.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <List className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Contents</p>
                </div>
                <nav className="space-y-0.5">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
                      className={`block py-1.5 text-xs transition-all rounded-lg px-2 ${
                        activeSection === h.id
                          ? "text-blue-700 font-bold bg-blue-50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      } ${h.level === 1 ? "font-semibold" : h.level === 2 ? "pl-4" : "pl-7 text-[11px]"}`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Tags */}
            {resource.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Topics</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {(resource.fileUrl || resource.videoUrl) && (
              <div className="mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Attachments</p>
                <div className="space-y-2">
                  {resource.fileUrl && (
                    <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group text-xs">
                      <Download className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-700 group-hover:text-blue-700 truncate">Download PDF</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {resource.videoUrl && (
                    <a href={resource.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group text-xs">
                      <span className="text-red-500 font-black flex-shrink-0">▶</span>
                      <span className="font-semibold text-slate-700 group-hover:text-red-700 truncate">Watch Video</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-auto flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Admin */}
            {isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide mb-2">Admin Actions</p>
                <button onClick={() => navigate(`/resources/${typeSlug}`)}
                  className="flex items-center gap-2 w-full py-2 px-2.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit on List Page
                </button>
                <button onClick={handleDelete}
                  className="flex items-center gap-2 w-full py-2 px-2.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Resource
                </button>
              </div>
            )}
          </div>

          {/* Back link at bottom */}
          <div className="p-4 border-t border-slate-100 flex-shrink-0">
            <Link to={`/resources/${typeSlug}`}
              className="flex items-center gap-2 w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to {typeInfo.label}
            </Link>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Content */}
        <main ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              {/* Sidebar toggle for desktop */}
              <div className="hidden md:flex items-center gap-2 mb-6">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Menu className="w-3.5 h-3.5" />
                  {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                </button>
              </div>

              {resource.description && (
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <p className="text-slate-600 leading-relaxed">{resource.description}</p>
                </div>
              )}
              {resource.content ? (
                <MarkdownRenderer content={resource.content} />
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Content coming soon</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
