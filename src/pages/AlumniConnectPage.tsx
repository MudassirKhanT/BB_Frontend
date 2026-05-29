import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  BadgeCheck,
  Building2,
  Clock,
  Heart,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ArrowLeft,
  X,
  Plus,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { alumniApi } from "@/lib/api";
import {
  AlumniProfile,
  AlumniExperience,
  AlumniSlot,
  AlumniReferral,
  AlumniAMA,
  getErrorMessage,
} from "@/types/models";

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white transition-all ${
        type === "success" ? "bg-emerald-500" : "bg-red-500"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-80 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── AlumniAvatar ──────────────────────────────────────────────────────────────
interface AlumniAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  rank?: number;
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-rose-500",
];

function AlumniAvatar({ name, size = "md", rank }: AlumniAvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const colorClass =
    rank === 1
      ? "bg-amber-400"
      : rank === 2
      ? "bg-slate-400"
      : rank === 3
      ? "bg-orange-400"
      : AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  const sizeClass =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
      ? "w-14 h-14 text-xl"
      : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-black flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// ── Domain badge color mapping ────────────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  "Software Engineering": "bg-blue-100 text-blue-700 border border-blue-200",
  "Data Science": "bg-purple-100 text-purple-700 border border-purple-200",
  "Frontend Development": "bg-pink-100 text-pink-700 border border-pink-200",
  "Backend Development": "bg-green-100 text-green-700 border border-green-200",
  "DevOps & Cloud": "bg-orange-100 text-orange-700 border border-orange-200",
  "Product Management": "bg-teal-100 text-teal-700 border border-teal-200",
  "Machine Learning": "bg-violet-100 text-violet-700 border border-violet-200",
  "Full Stack Development": "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] ?? "bg-slate-100 text-slate-700 border border-slate-200";
}

// ── Session type badge color ───────────────────────────────────────────────────
function getSessionTypeColor(type: AlumniSlot["sessionType"]): string {
  if (type === "Mentorship") return "bg-purple-100 text-purple-700";
  if (type === "Mock Interview") return "bg-blue-100 text-blue-700";
  return "bg-green-100 text-green-700";
}

// ── Loading / Error helpers ───────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );
}

function ErrorMessage({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-sm font-semibold">{msg}</p>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label }: { label: string }) {
  return (
    <span className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white text-sm font-semibold">
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: Experiences
// ─────────────────────────────────────────────────────────────────────────────
const EXPERIENCE_DOMAINS = [
  "Software Engineering","Data Science","Frontend Development","Backend Development",
  "DevOps & Cloud","Product Management","Machine Learning","Full Stack Development",
];
const DOMAINS = ["All", ...EXPERIENCE_DOMAINS];

function ExperiencesTab({ showToast }: { showToast: (t: ToastState) => void }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAlumni = user?.role === "alumni";

  const [experiences, setExperiences] = useState<AlumniExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState("All");
  const [search, setSearch] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", tags: "", readTime: 5 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await alumniApi.getExperiences(
        domain !== "All" ? domain : undefined,
        search || undefined
      );
      setExperiences(res.data ?? res ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [domain, search]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePostExperience() {
    if (!postForm.title.trim() || !postForm.content.trim()) return;
    try {
      setPosting(true);
      await alumniApi.createExperience({
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime: postForm.readTime,
        isPublished: true,
      });
      showToast({ message: "Experience posted successfully!", type: "success" });
      setShowPost(false);
      setPostForm({ title: "", content: "", tags: "", readTime: 5 });
      load();
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: "error" });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 mr-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search experiences…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none cursor-pointer font-semibold text-slate-700"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        {isAlumni && (
          <button
            onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Share Experience
          </button>
        )}
      </div>

      {/* Post Experience Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 text-lg">Share Your Experience</h3>
              <button onClick={() => setShowPost(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. How I cracked my first product interview" value={postForm.title} onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Your Story <span className="text-red-500">*</span></label>
                <textarea placeholder="Share your journey, lessons, tips…" value={postForm.content} onChange={(e) => setPostForm((f) => ({ ...f, content: e.target.value }))} rows={6} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
                <input type="text" placeholder="e.g. interview, amazon, tips" value={postForm.tags} onChange={(e) => setPostForm((f) => ({ ...f, tags: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Est. Read Time (min)</label>
                <input type="number" min={1} max={30} value={postForm.readTime} onChange={(e) => setPostForm((f) => ({ ...f, readTime: Number(e.target.value) }))} className="w-24 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <button onClick={handlePostExperience} disabled={!postForm.title.trim() || !postForm.content.trim() || posting} className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Experience
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage msg={error} />
      ) : experiences.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm font-semibold">
          No experiences found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {experiences.map((exp) => (
            <div
              key={exp._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5 flex flex-col flex-1">
                {/* Alumni info */}
                <div className="flex items-start gap-3 mb-3">
                  <AlumniAvatar name={exp.alumni.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-slate-900 text-sm truncate">
                        {exp.alumni.name}
                      </span>
                      {exp.alumni.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{exp.alumni.currentRole}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{exp.alumni.currentCompany}</span>
                    </div>
                  </div>
                </div>

                {/* Batch + domain badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 font-semibold">
                    <GraduationCap className="w-3 h-3" />
                    {exp.alumni.batch}
                  </span>
                  <span
                    className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${getDomainColor(
                      exp.domain
                    )}`}
                  >
                    {exp.domain}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-black text-slate-900 text-base mb-2 leading-snug">
                  {exp.title}
                </h3>

                {/* Content excerpt */}
                <p className="text-sm text-slate-600 line-clamp-3 flex-1 mb-3">{exp.content}</p>

                {/* Tags */}
                {exp.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {exp.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {exp.readTime} min read
                  </span>
                  <button
                    onClick={() => toggleLike(exp._id)}
                    className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                      likedIds.has(exp._id)
                        ? "text-rose-500"
                        : "text-slate-400 hover:text-rose-500"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${likedIds.has(exp._id) ? "fill-rose-500" : ""}`}
                    />
                    {exp.likes + (likedIds.has(exp._id) ? 1 : 0)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: 1:1 Connect
// ─────────────────────────────────────────────────────────────────────────────
interface ToastState {
  message: string;
  type: "success" | "error";
}

function ConnectTab({ showToast }: { showToast: (t: ToastState) => void }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAlumni = user?.role === "alumni";

  const [slots, setSlots] = useState<AlumniSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState<AlumniSlot | null>(null);
  const [topic, setTopic] = useState("");
  const [booking, setBooking] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: "", time: "", duration: 30 as 30 | 60,
    sessionType: "Mentorship" as AlumniSlot["sessionType"],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await alumniApi.getSlots();
      setSlots(res.data ?? res ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const available = slots.filter((s) => !s.isBooked);

  async function handleBook() {
    if (!bookingSlot || !topic.trim()) return;
    try {
      setBooking(true);
      await alumniApi.bookSlot(bookingSlot._id, topic.trim());
      setSlots((prev) =>
        prev.map((s) => (s._id === bookingSlot._id ? { ...s, isBooked: true } : s))
      );
      showToast({ message: "Session booked! Alumni will confirm shortly.", type: "success" });
      setBookingSlot(null);
      setTopic("");
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: "error" });
    } finally {
      setBooking(false);
    }
  }

  async function handleAddSlot() {
    if (!slotForm.date || !slotForm.time) return;
    try {
      setAddingSlot(true);
      await alumniApi.createSlot(slotForm);
      showToast({ message: "Slot added! Students can now book it.", type: "success" });
      setShowAddSlot(false);
      setSlotForm({ date: "", time: "", duration: 30, sessionType: "Mentorship" });
      load();
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: "error" });
    } finally {
      setAddingSlot(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        {!loading && !error && (
          <p className="text-sm text-slate-500 font-semibold">
            {available.length} slot{available.length !== 1 ? "s" : ""} available
          </p>
        )}
        {isAlumni && (
          <button onClick={() => setShowAddSlot(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors ml-auto">
            <Plus className="w-4 h-4" /> Add Availability
          </button>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 text-lg">Add Availability</h3>
              <button onClick={() => setShowAddSlot(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={slotForm.date} onChange={(e) => setSlotForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Time <span className="text-red-500">*</span></label>
                  <input type="time" value={slotForm.time} onChange={(e) => setSlotForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Session Type</label>
                <select value={slotForm.sessionType} onChange={(e) => setSlotForm((f) => ({ ...f, sessionType: e.target.value as AlumniSlot["sessionType"] }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  <option>Mentorship</option>
                  <option>Mock Interview</option>
                  <option>Career Guidance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Duration</label>
                <div className="flex gap-3">
                  {([30, 60] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setSlotForm((f) => ({ ...f, duration: d }))} className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${slotForm.duration === d ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-200 text-slate-500"}`}>
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleAddSlot} disabled={!slotForm.date || !slotForm.time || addingSlot} className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {addingSlot && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Slot
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage msg={error} />
      ) : available.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm font-semibold">
          No available slots right now. Check back soon!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {available.map((slot) => (
            <div
              key={slot._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlumniAvatar name={slot.alumni.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-sm truncate">
                      {slot.alumni.name}
                    </span>
                    {slot.alumni.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{slot.alumni.currentRole}</p>
                  <p className="text-xs text-slate-400 truncate">{slot.alumni.currentCompany}</p>
                </div>
              </div>

              <span
                className={`inline-block text-xs font-semibold rounded-full px-3 py-1 mb-4 ${getSessionTypeColor(
                  slot.sessionType
                )}`}
              >
                {slot.sessionType}
              </span>

              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{slot.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{slot.time}</span>
                  <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-semibold rounded-full px-2.5 py-0.5">
                    {slot.duration} min
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setBookingSlot(slot);
                  setTopic("");
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
              >
                Book Session
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Book Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 text-lg">Book Session</h3>
              <button
                onClick={() => setBookingSlot(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
              <AlumniAvatar name={bookingSlot.alumni.name} size="md" />
              <div>
                <p className="font-bold text-slate-900 text-sm">{bookingSlot.alumni.name}</p>
                <p className="text-xs text-slate-500">{bookingSlot.sessionType}</p>
                <p className="text-xs text-slate-500">
                  {bookingSlot.date} at {bookingSlot.time} · {bookingSlot.duration} min
                </p>
              </div>
            </div>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              What do you want to discuss? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your topic or questions…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-5"
            />

            <button
              onClick={handleBook}
              disabled={!topic.trim() || booking}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {booking && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: Referrals
// ─────────────────────────────────────────────────────────────────────────────
function ReferralsTab({ showToast }: { showToast: (t: ToastState) => void }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAlumni = user?.role === "alumni";

  const [referrals, setReferrals] = useState<AlumniReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [refForm, setRefForm] = useState({
    role: "", description: "", skills: "", location: "Remote", jobUrl: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await alumniApi.getReferrals();
      setReferrals(res.data ?? res ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = referrals.filter((r) => r.isActive);

  async function handleApply(id: string) {
    try {
      setApplyingId(id);
      await alumniApi.applyReferral(id);
      setReferrals((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, applicantsCount: r.applicantsCount + 1 } : r
        )
      );
      showToast({ message: "Application submitted! The alumni will reach out soon.", type: "success" });
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: "error" });
    } finally {
      setApplyingId(null);
    }
  }

  async function handlePostReferral() {
    if (!refForm.role.trim() || !refForm.description.trim()) return;
    try {
      setPosting(true);
      await alumniApi.createReferral({
        role: refForm.role.trim(),
        description: refForm.description.trim(),
        skills: refForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        location: refForm.location.trim() || "Remote",
        jobUrl: refForm.jobUrl.trim(),
      });
      showToast({ message: "Referral posted! Students can now apply.", type: "success" });
      setShowPost(false);
      setRefForm({ role: "", description: "", skills: "", location: "Remote", jobUrl: "" });
      load();
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: "error" });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        {!loading && !error && (
          <p className="text-sm text-slate-500 font-semibold">
            {active.length} active referral{active.length !== 1 ? "s" : ""} open
          </p>
        )}
        {isAlumni && (
          <button onClick={() => setShowPost(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors ml-auto">
            <Plus className="w-4 h-4" /> Post Referral
          </button>
        )}
      </div>

      {/* Post Referral Modal */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 text-lg">Post a Referral</h3>
              <button onClick={() => setShowPost(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Role <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Frontend Engineer" value={refForm.role} onChange={(e) => setRefForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Description <span className="text-red-500">*</span></label>
                <textarea placeholder="Describe the role, requirements, what you're looking for…" value={refForm.description} onChange={(e) => setRefForm((f) => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Skills Required <span className="text-slate-400 font-normal">(comma separated)</span></label>
                <input type="text" placeholder="e.g. React, Node.js, MongoDB" value={refForm.skills} onChange={(e) => setRefForm((f) => ({ ...f, skills: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Location</label>
                  <input type="text" placeholder="Remote / Bengaluru" value={refForm.location} onChange={(e) => setRefForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Job URL <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="url" placeholder="https://..." value={refForm.jobUrl} onChange={(e) => setRefForm((f) => ({ ...f, jobUrl: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
            </div>
            <button onClick={handlePostReferral} disabled={!refForm.role.trim() || !refForm.description.trim() || posting} className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Referral
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage msg={error} />
      ) : active.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm font-semibold">
          No active referrals at the moment.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {active.map((ref) => (
            <div
              key={ref._id}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col gap-4"
            >
              {/* Company + role + location */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-500">{ref.company}</span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-snug mb-1">{ref.role}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{ref.location}</span>
                </div>
              </div>

              {/* Alumni */}
              <div className="flex items-center gap-2.5">
                <AlumniAvatar name={ref.alumni.name} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-800 truncate">{ref.alumni.name}</span>
                    {ref.alumni.isVerified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {ref.alumni.currentRole} @ {ref.alumni.currentCompany}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 line-clamp-2">{ref.description}</p>

              {/* Skills */}
              {ref.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ref.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5 font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Deadline */}
              {ref.deadline && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Deadline: {ref.deadline}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  {ref.applicantsCount} applied
                </span>
                <button
                  onClick={() => handleApply(ref._id)}
                  disabled={applyingId === ref._id}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {applyingId === ref._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Apply for Referral
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: AMA
// ─────────────────────────────────────────────────────────────────────────────
function AMATab({ showToast }: { showToast: (t: ToastState) => void }) {
  const [amas, setAmas] = useState<AlumniAMA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeAMA, setActiveAMA] = useState<AlumniAMA | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await alumniApi.getAMAs();
      setAmas(res.data ?? res ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePostQuestion() {
    if (!activeAMA || !questionText.trim()) return;
    try {
      setPosting(true);
      await alumniApi.postQuestion(activeAMA._id, questionText.trim());
      showToast({ message: "Question posted! The alumni will answer it soon.", type: "success" });
      setQuestionText("");
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: "error" });
    } finally {
      setPosting(false);
    }
  }

  function getStatusBadge(ama: AlumniAMA) {
    if (ama.isLive) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      );
    }
    if (ama.isCompleted) {
      return (
        <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
          Completed
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-blue-600 bg-blue-100 rounded-full px-2.5 py-1">
        Upcoming
      </span>
    );
  }

  if (activeAMA) {
    const sorted = [...activeAMA.questions].sort((a, b) =>
      a.isAnswered === b.isAnswered ? 0 : a.isAnswered ? -1 : 1
    );

    return (
      <div>
        <button
          onClick={() => setActiveAMA(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AMA Sessions
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <AlumniAvatar name={activeAMA.alumni.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-black text-slate-900 text-xl">{activeAMA.alumni.name}</span>
                {activeAMA.alumni.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-indigo-600" />
                )}
                {getStatusBadge(activeAMA)}
              </div>
              <p className="text-sm text-slate-500">{activeAMA.alumni.currentRole} @ {activeAMA.alumni.currentCompany}</p>
            </div>
          </div>
          <h2 className="font-black text-slate-900 text-2xl mb-2">{activeAMA.title}</h2>
          <p className="text-slate-600 text-sm">{activeAMA.description}</p>
        </div>

        {/* Q&A list */}
        <h3 className="font-black text-slate-900 text-lg mb-4">
          Questions ({sorted.length})
        </h3>
        <div className="flex flex-col gap-4 mb-8">
          {sorted.length === 0 && (
            <p className="text-sm text-slate-400 font-semibold text-center py-8">
              No questions yet. Be the first to ask!
            </p>
          )}
          {sorted.map((q) => (
            <div
              key={q._id}
              className={`bg-white rounded-xl border p-5 ${
                q.isAnswered ? "border-slate-100" : "border-dashed border-slate-200 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-800 text-sm">{q.question}</p>
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                  by {q.studentName}
                </span>
              </div>
              {q.isAnswered ? (
                <div className="bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-400">
                  <p className="text-sm text-slate-700">{q.answer}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Awaiting answer…</p>
              )}
            </div>
          ))}
        </div>

        {/* Ask question form */}
        {!activeAMA.isCompleted && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h4 className="font-black text-slate-900 mb-3">Ask a Question</h4>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-3"
            />
            <button
              onClick={handlePostQuestion}
              disabled={!questionText.trim() || posting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold transition-colors flex items-center gap-2"
            >
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Question
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage msg={error} />
      ) : amas.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm font-semibold">
          No AMA sessions scheduled.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {amas.map((ama) => (
            <div
              key={ama._id}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow relative"
            >
              {/* Status badge */}
              <div className="absolute top-4 right-4">{getStatusBadge(ama)}</div>

              {/* Alumni */}
              <div className="flex items-center gap-3 mb-4 pr-24">
                <AlumniAvatar name={ama.alumni.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-sm truncate">{ama.alumni.name}</span>
                    {ama.alumni.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{ama.alumni.currentRole}</p>
                </div>
              </div>

              {/* Title + description */}
              <h3 className="font-black text-slate-900 text-base mb-1">{ama.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ama.description}</p>

              {/* Scheduled at */}
              {ama.scheduledAt && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ama.scheduledAt}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {ama.questions.length} questions
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {ama.registrationsCount} registered
                </span>
              </div>

              <button
                onClick={() => setActiveAMA(ama)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
              >
                View Q&amp;A
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
type TabId = "experiences" | "connect" | "referrals" | "ama";

const TABS: { id: TabId; label: string }[] = [
  { id: "experiences", label: "Experiences" },
  { id: "connect", label: "1:1 Connect" },
  { id: "referrals", label: "Referrals" },
  { id: "ama", label: "AMA" },
];

export default function AlumniConnectPage() {
  const [activeTab, setActiveTab] = useState<TabId>("experiences");
  const [toast, setToast] = useState<ToastState | null>(null);

  function handleTabChange(id: TabId) {
    setActiveTab(id);
  }

  function showToast(t: ToastState) {
    setToast(t);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap className="w-12 h-12 text-indigo-400 mb-4 mx-auto" />
          <h1 className="text-4xl font-black text-white mb-3">Alumni Connect</h1>
          <p className="text-indigo-200 text-lg font-medium mb-8">
            Learn from those who've been where you're going
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StatPill label="200+ Alumni" />
            <StatPill label="500+ Sessions" />
            <StatPill label="150+ Referrals" />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 px-5 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {activeTab === "experiences" && <ExperiencesTab showToast={showToast} />}
        {activeTab === "connect" && <ConnectTab showToast={showToast} />}
        {activeTab === "referrals" && <ReferralsTab showToast={showToast} />}
        {activeTab === "ama" && <AMATab showToast={showToast} />}
      </main>

      <Footer />
    </div>
  );
}
