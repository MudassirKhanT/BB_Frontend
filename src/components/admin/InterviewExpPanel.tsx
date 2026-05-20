import { useState, useEffect } from "react";
import { CheckCircle2, Trash2, Loader2, Users, ExternalLink, RefreshCw } from "lucide-react";
import { interviewExpApi } from "../../lib/api";
import type { InterviewExperience } from "@/types/models";

export default function InterviewExpPanel() {
  const [pending, setPending]   = useState<InterviewExperience[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab]           = useState<"pending" | "all">("pending");
  const [all, setAll]           = useState<InterviewExperience[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const loadPending = () => {
    setLoading(true);
    interviewExpApi.getPending().then((d) => {
      setPending(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const loadAll = () => {
    setLoadingAll(true);
    interviewExpApi.getAll().then((d) => {
      setAll(Array.isArray(d) ? d : d.experiences ?? []);
      setLoadingAll(false);
    }).catch(() => setLoadingAll(false));
  };

  useEffect(() => { loadPending(); }, []);
  useEffect(() => { if (tab === "all" && all.length === 0) loadAll(); }, [tab]);

  const approve = async (id: string) => {
    setActing(id);
    try { await interviewExpApi.approve(id); loadPending(); if (tab === "all") loadAll(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
    finally { setActing(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await interviewExpApi.delete(deleteId);
      setDeleteId(null); loadPending(); if (tab === "all") loadAll();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "An error occurred"); }
  };

  const RESULT_COLOR: Record<string, string> = {
    selected: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };

  const Card = ({ item, showApprove }: { item: InterviewExperience; showApprove: boolean }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-900">{item.authorName || "Anonymous"}</span>
            <span className="text-slate-400">·</span>
            <span className="text-sm font-semibold text-slate-600">{item.role}</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${RESULT_COLOR[item.result] || "bg-slate-100 text-slate-600"}`}>{item.result}</span>
            {item.isApproved && <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">Approved</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {(typeof item.company === "object" ? item.company.name : item.company) || "Unknown company"} · {item.year}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showApprove && !item.isApproved && (
            <button onClick={() => approve(item._id)} disabled={acting === item._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-all">
              {acting === item._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Approve
            </button>
          )}
          <button onClick={() => setDeleteId(item._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{item.experience}</p>
      {item.rounds?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.rounds.map((r: string, i: number) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">{r}</span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["pending", "all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "pending" ? `Pending (${pending.length})` : "All Approved"}
            </button>
          ))}
        </div>
        <button onClick={tab === "pending" ? loadPending : loadAll}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {tab === "pending" ? (
        loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center py-16 bg-white rounded-2xl border border-slate-100">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
            <p className="font-black text-slate-900">All caught up!</p>
            <p className="text-sm text-slate-500 mt-1">No pending interview experiences to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <Users className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-semibold text-orange-700">{pending.length} experience{pending.length > 1 ? "s" : ""} waiting for your approval</p>
              </div>
            )}
            {pending.map(item => <Card key={item._id} item={item} showApprove={true} />)}
          </div>
        )
      ) : (
        loadingAll ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading…</div>
        ) : all.length === 0 ? (
          <div className="flex flex-col items-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
            <ExternalLink className="w-10 h-10 mb-3 opacity-40" /><p className="font-semibold">No experiences yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {all.map(item => <Card key={item._id} item={item} showApprove={!item.isApproved} />)}
          </div>
        )
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-black text-slate-900 mb-2">Delete Experience?</h3>
            <p className="text-sm text-slate-500 mb-5">This interview experience will be permanently removed.</p>
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
