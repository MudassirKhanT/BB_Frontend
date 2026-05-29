import { useState, useEffect } from "react";
import { Pencil, Trash2, X, Loader2, Users, BadgeCheck, Search } from "lucide-react";
import { alumniApi } from "../../lib/api";
import type { AlumniProfile } from "@/types/models";

interface EditForm {
  name: string;
  currentRole: string;
  currentCompany: string;
  batch: string;
  branch: string;
  domain: string;
  bio: string;
  linkedIn: string;
}

const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>{children}</div>
);

export default function AlumniPanel() {
  const [profiles, setProfiles]     = useState<AlumniProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [editItem, setEditItem]     = useState<AlumniProfile | null>(null);
  const [form, setForm]             = useState<EditForm>({ name: "", currentRole: "", currentCompany: "", batch: "", branch: "", domain: "", bio: "", linkedIn: "" });
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [error, setError]           = useState("");

  const load = () => {
    setLoading(true);
    alumniApi.adminGetAll()
      .then((d: AlumniProfile[]) => { setProfiles(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (p: AlumniProfile) => {
    setEditItem(p);
    setForm({ name: p.name, currentRole: p.currentRole, currentCompany: p.currentCompany, batch: p.batch, branch: p.branch || "", domain: p.domain, bio: p.bio || "", linkedIn: p.linkedIn || "" });
    setError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await alumniApi.adminUpdate(editItem!._id, form);
      setEditItem(null); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to update"); }
    finally { setSaving(false); }
  };

  const handleToggleVerify = async (id: string) => {
    try {
      const updated = await alumniApi.adminToggleVerify(id) as AlumniProfile;
      setProfiles(prev => prev.map(p => p._id === id ? updated : p));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await alumniApi.adminDelete(deleteId); setDeleteId(null); load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const filtered = profiles.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.currentCompany.toLowerCase().includes(search.toLowerCase()) ||
    p.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 flex-1 shadow-sm max-w-sm" style={{ border: "1px solid #e2e8f0" }}>
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="text" placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 text-slate-700" />
          {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
        </div>
        <p className="text-sm text-slate-500 font-semibold ml-auto">{filtered.length} alumni</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><Users className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No alumni found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Name", "Company / Role", "Domain", "Batch", "Score", "Verified", "Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-xs">
                            {p.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700 text-xs">{p.currentRole}</p>
                      <p className="text-xs text-slate-400">{p.currentCompany}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{p.domain}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.batch}</td>
                    <td className="px-4 py-3 font-semibold text-violet-600">{p.contributionScore ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVerify(p._id)}
                        title={p.isVerified ? "Unverify" : "Verify"}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${p.isVerified ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600" : "bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600"}`}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        {p.isVerified ? "Verified" : "Unverified"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(p._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">Edit Alumni Profile</h2>
              <button onClick={() => setEditItem(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Name *"><input className={inp} value={form.name} required onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></F>
                <F label="Current Role *"><input className={inp} value={form.currentRole} required onChange={e => setForm(f => ({ ...f, currentRole: e.target.value }))} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Current Company *"><input className={inp} value={form.currentCompany} required onChange={e => setForm(f => ({ ...f, currentCompany: e.target.value }))} /></F>
                <F label="Domain *"><input className={inp} value={form.domain} required onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Batch *"><input className={inp} value={form.batch} required onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} /></F>
                <F label="Branch"><input className={inp} value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} /></F>
              </div>
              <F label="LinkedIn URL"><input className={inp} value={form.linkedIn} placeholder="https://linkedin.com/in/..." onChange={e => setForm(f => ({ ...f, linkedIn: e.target.value }))} /></F>
              <F label="Bio"><textarea className={inp} rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></F>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Alumni Profile?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the profile and all associated data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
