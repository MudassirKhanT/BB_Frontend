import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, Globe, GitBranch, BookOpen, GraduationCap,
  FileText, Edit3, Save, X, Plus, Tag, ExternalLink, Award,
  ChevronRight, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { userApi } from "@/lib/api";

const BRANCHES = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Aerospace Engineering",
  "Other",
];

const GRAD_YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

interface UserData {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  // Academic
  college?: string;
  branch?: string;
  cgpa?: number;
  graduationYear?: number;
  // Professional
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string[];
  resumeUrl?: string;
}

interface FormData {
  username: string;
  bio: string;
  avatar: string;
  college: string;
  branch: string;
  cgpa: string;
  graduationYear: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeUrl: string;
  skillInput: string;
  skills: string[];
}

function Initials({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const letters = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center font-black text-white shrink-0 ${
        size === "lg" ? "w-24 h-24 text-3xl" : "w-9 h-9 text-sm"
      }`}
    >
      {letters || "?"}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 break-all">{value}</p>
      </div>
    </div>
  );
}

function LinkRow({ icon, label, url }: { icon: React.ReactNode; label: string; url?: string }) {
  if (!url) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <a href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 truncate">
          {url.replace(/^https?:\/\//, "")}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<FormData>({
    username: "", bio: "", avatar: "", college: "", branch: "",
    cgpa: "", graduationYear: "", phone: "", linkedinUrl: "",
    githubUrl: "", resumeUrl: "", skillInput: "", skills: [],
  });

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    userApi.getProfile()
      .then((data: UserData) => {
        setUser(data);
        setForm({
          username: data.username || "",
          bio: data.bio || "",
          avatar: data.avatar || "",
          college: data.college || "",
          branch: data.branch || "",
          cgpa: data.cgpa != null ? String(data.cgpa) : "",
          graduationYear: data.graduationYear ? String(data.graduationYear) : "",
          phone: data.phone || "",
          linkedinUrl: data.linkedinUrl || "",
          githubUrl: data.githubUrl || "",
          resumeUrl: data.resumeUrl || "",
          skillInput: "",
          skills: data.skills || [],
        });
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        college: form.college.trim(),
        branch: form.branch,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : undefined,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
        phone: form.phone.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        resumeUrl: form.resumeUrl.trim(),
        skills: form.skills,
      };
      const res: any = await userApi.updateProfile(payload);
      setUser((prev) => prev ? { ...prev, ...payload, skills: form.skills } : prev);
      localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), username: payload.username }));
      setEditing(false);
      showToast(res.message || "Profile updated!");
    } catch (err: any) {
      showToast(err.message || "Failed to save", false);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm((f) => ({ ...f, skills: [...f.skills, s], skillInput: "" }));
    } else {
      setForm((f) => ({ ...f, skillInput: "" }));
    }
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profileComplete = [user.college, user.branch, user.cgpa, user.resumeUrl, user.phone].filter(Boolean).length;
  const completionPct = Math.round((profileComplete / 5) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold transition-all ${toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg shrink-0" />
            ) : (
              <Initials name={user.username} size="lg" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-900">{user.username}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${user.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {user.email}
              </p>
              {user.bio && <p className="text-sm text-slate-600 leading-relaxed max-w-xl">{user.bio}</p>}
              <p className="text-xs text-slate-400 mt-2">Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          {/* Profile completion bar */}
          {completionPct < 100 && (
            <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700">Profile Completion</span>
                <span className="text-xs font-black text-amber-700">{completionPct}%</span>
              </div>
              <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <p className="text-xs text-amber-600 mt-1.5">Add college, branch, CGPA, phone, and resume to complete your profile</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Academic Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                Academic Info
              </h2>
              {[user.college, user.branch, user.cgpa, user.graduationYear].some(Boolean) ? (
                <>
                  <InfoRow icon={<BookOpen className="w-3.5 h-3.5" />} label="College" value={user.college} />
                  <InfoRow icon={<GraduationCap className="w-3.5 h-3.5" />} label="Branch" value={user.branch} />
                  <InfoRow icon={<Award className="w-3.5 h-3.5" />} label="CGPA" value={user.cgpa != null ? `${user.cgpa} / 10` : undefined} />
                  <InfoRow icon={<ChevronRight className="w-3.5 h-3.5" />} label="Graduation Year" value={user.graduationYear} />
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No academic info added yet</p>
              )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                Contact & Links
              </h2>
              {[user.phone, user.linkedinUrl, user.githubUrl].some(Boolean) ? (
                <>
                  <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={user.phone} />
                  <LinkRow icon={<Globe className="w-3.5 h-3.5" />} label="LinkedIn" url={user.linkedinUrl} />
                  <LinkRow icon={<GitBranch className="w-3.5 h-3.5" />} label="GitHub" url={user.githubUrl} />
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No contact info added yet</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-violet-600" />
                </div>
                Skills
              </h2>
              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No skills added yet. Edit your profile to add skills.</p>
              )}
            </div>

            {/* Resume */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                Resume
              </h2>
              {user.resumeUrl ? (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-12 h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{user.resumeUrl.split("/").pop() || "Resume"}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.resumeUrl}</p>
                  </div>
                  <a href={user.resumeUrl.startsWith("http") ? user.resumeUrl : `https://${user.resumeUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200 hover:bg-orange-100 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">No resume linked</p>
                  <p className="text-xs text-slate-400">Add a Google Drive, Dropbox, or hosted PDF link</p>
                  <button onClick={() => setEditing(true)} className="mt-3 text-xs font-semibold text-primary hover:underline">
                    + Add Resume Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Drawer / Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(15,23,42,0.5)" }}>
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-screen sm:max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <h2 className="font-black text-slate-900">Edit Profile</h2>
              </div>
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              {/* Basic Info */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Basic Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Username</label>
                    <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className={inputCls} placeholder="Your display name" maxLength={20} />
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className={`${inputCls} resize-none`} rows={3}
                      placeholder="A short introduction about yourself..." maxLength={300} />
                    <p className="text-xs text-slate-400 text-right mt-1">{form.bio.length}/300</p>
                  </div>
                  <div>
                    <label className={labelCls}>Profile Photo URL</label>
                    <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                      className={inputCls} placeholder="https://example.com/photo.jpg" />
                    <p className="text-xs text-slate-400 mt-1">Paste a direct image URL (leave blank to use initials)</p>
                  </div>
                </div>
              </section>

              {/* Academic Info */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" /> Academic Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>College / University</label>
                    <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })}
                      className={inputCls} placeholder="e.g. Anna University, IIT Madras" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Branch / Department</label>
                      <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className={inputCls}>
                        <option value="">Select branch</option>
                        {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Graduation Year</label>
                      <select value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} className={inputCls}>
                        <option value="">Select year</option>
                        {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="sm:w-1/2">
                    <label className={labelCls}>CGPA</label>
                    <input type="number" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                      className={inputCls} placeholder="e.g. 8.5" min={0} max={10} step={0.01} />
                    <p className="text-xs text-slate-400 mt-1">Enter on a scale of 10</p>
                  </div>
                </div>
              </section>

              {/* Contact & Links */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Contact & Links
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputCls} placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className={labelCls}>LinkedIn URL</label>
                    <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                      className={inputCls} placeholder="linkedin.com/in/yourname" />
                  </div>
                  <div>
                    <label className={labelCls}>GitHub URL</label>
                    <input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                      className={inputCls} placeholder="github.com/yourusername" />
                  </div>
                </div>
              </section>

              {/* Skills */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Skills
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    value={form.skillInput}
                    onChange={(e) => setForm({ ...form, skillInput: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    className={`${inputCls} flex-1`}
                    placeholder="e.g. React, Python, DSA…"
                  />
                  <button onClick={addSkill} className="px-3 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Resume */}
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Resume
                </h3>
                <div>
                  <label className={labelCls}>Resume Link</label>
                  <input value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                    className={inputCls} placeholder="https://drive.google.com/file/d/..." />
                  <p className="text-xs text-slate-400 mt-1">Paste a public Google Drive, Dropbox, or hosted PDF link</p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
