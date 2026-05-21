import { useState, useEffect } from "react";
import { Loader2, UserCog, ShieldOff, Shield, RefreshCw, Search, Crown } from "lucide-react";
import { adminUserApi } from "../../lib/api";
import type { User } from "@/types/models";

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  instructor: "bg-blue-100 text-blue-700",
  student: "bg-slate-100 text-slate-600",
};

export default function UsersPanel() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleF]= useState("all");

  const load = () => {
    setLoading(true);
    adminUserApi.getAll().then((d) => {
      setUsers(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleBlock = async (user: User) => {
    setActing(user._id);
    try {
      if (user.isBlocked) await adminUserApi.unblock(user._id);
      else await adminUserApi.block(user._id);
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
    finally { setActing(null); }
  };

  const changeRole = async (user: User, role: string) => {
    setActing(user._id);
    try { await adminUserApi.setRole(user._id, role); load(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
    finally { setActing(null); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = { total: users.length, admin: users.filter(u => u.role === "admin").length, instructor: users.filter(u => u.role === "instructor").length, blocked: users.filter(u => u.isBlocked).length };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: counts.total, color: "text-slate-900" },
          { label: "Admins", value: counts.admin, color: "text-violet-700" },
          { label: "Instructors", value: counts.instructor, color: "text-blue-700" },
          { label: "Blocked", value: counts.blocked, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className={`text-2xl font-black ${color}`}>{loading ? "—" : value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {["all", "student", "instructor", "admin"].map(r => (
            <button key={r} onClick={() => setRoleF(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${roleFilter === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><UserCog className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No users found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["User", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-slate-600 ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(user => (
                  <tr key={user._id} className={`hover:bg-slate-50 ${user.isBlocked ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-black text-xs">{(user.username || user.email || "?")[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            {user.username || "—"}
                            {user.role === "admin" && <Crown className="w-3 h-3 text-violet-500" />}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      <select value={user.role} disabled={acting === user._id}
                        onChange={e => changeRole(user, e.target.value)}
                        className={`px-2 py-0.5 rounded-md text-xs font-bold border-0 outline-none cursor-pointer ${ROLE_COLOR[user.role] || "bg-slate-100"}`}>
                        {["student","instructor","admin"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${user.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => toggleBlock(user)} disabled={acting === user._id}
                          title={user.isBlocked ? "Unblock user" : "Block user"}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                            user.isBlocked
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}>
                          {acting === user._id ? <Loader2 className="w-3 h-3 animate-spin" /> : user.isBlocked ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
