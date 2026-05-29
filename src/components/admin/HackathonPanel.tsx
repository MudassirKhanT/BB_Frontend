import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit, Trash2, ChevronRight, Loader2, X, AlertCircle,
  CheckCircle2, Lock, Users, Trophy, GitBranch, ExternalLink,
  ArrowLeft, Play,
} from "lucide-react";
import { hackathonApi } from "@/lib/api";
import type {
  Hackathon,
  HackathonPS,
  HackathonTeam,
  HackathonSubmission,
  HackathonLeaderboardEntry,
} from "@/types/models";
import { getErrorMessage } from "@/types/models";

// ── Helpers ────────────────────────────────────────────────────────────────────
function DiffBadge({ diff }: { diff: "Easy" | "Medium" | "Hard" }) {
  const cls =
    diff === "Easy"
      ? "bg-green-100 text-green-700 border-green-200"
      : diff === "Medium"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>{diff}</span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "active")
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Active</span>;
  if (status === "upcoming")
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Upcoming</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Ended</span>;
}

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${ok ? "bg-green-600" : "bg-red-600"}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ── Hackathon form initial state ───────────────────────────────────────────────
type HForm = {
  title: string; slug: string; description: string; theme: string;
  startTime: string; endTime: string; minTeamSize: number; maxTeamSize: number;
  prizePool: string; banner: string; isPublished: boolean;
};

const emptyHForm = (): HForm => ({
  title: "", slug: "", description: "", theme: "",
  startTime: "", endTime: "", minTeamSize: 2, maxTeamSize: 4,
  prizePool: "", banner: "#6d28d9", isPublished: false,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── PS form initial state ──────────────────────────────────────────────────────
type PSForm = {
  title: string; description: string; techStack: string;
  difficulty: "Easy" | "Medium" | "Hard"; isPublished: boolean; order: number;
};

const emptyPSForm = (): PSForm => ({
  title: "", description: "", techStack: "", difficulty: "Medium", isPublished: true, order: 1,
});

// ── Detail view ────────────────────────────────────────────────────────────────
function HackathonDetail({
  hackathon,
  onBack,
  showToast,
}: {
  hackathon: Hackathon;
  onBack: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const [dtab, setDtab] = useState<"ps" | "teams" | "results">("ps");
  const [psList, setPsList] = useState<HackathonPS[]>([]);
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [submissions, setSubmissions] = useState<HackathonSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<HackathonLeaderboardEntry[]>([]);
  const [loadingPS, setLoadingPS] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  // PS modal
  const [psModal, setPsModal] = useState<{ open: boolean; ps?: HackathonPS }>({ open: false });
  const [psForm, setPsForm] = useState<PSForm>(emptyPSForm());
  const [savingPS, setSavingPS] = useState(false);

  const loadPS = useCallback(async () => {
    setLoadingPS(true);
    try {
      const data = await hackathonApi.getBySlug(hackathon.slug);
      setPsList(data.problemStatements ?? []);
    } catch { /* ignore */ }
    finally { setLoadingPS(false); }
  }, [hackathon.slug]);

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const data = await hackathonApi.getAdminTeams(hackathon._id);
      setTeams(data.teams ?? data ?? []);
    } catch { /* ignore */ }
    finally { setLoadingTeams(false); }
  }, [hackathon._id]);

  const loadResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      const [subData, lbData] = await Promise.all([
        hackathonApi.getAdminSubmissions(hackathon._id),
        hackathonApi.getLeaderboard(hackathon._id),
      ]);
      setSubmissions(subData.submissions ?? subData ?? []);
      setLeaderboard(lbData.leaderboard ?? lbData ?? []);
    } catch { /* ignore */ }
    finally { setLoadingResults(false); }
  }, [hackathon._id]);

  useEffect(() => { loadPS(); }, [loadPS]);
  useEffect(() => { if (dtab === "teams") loadTeams(); }, [dtab, loadTeams]);
  useEffect(() => { if (dtab === "results") loadResults(); }, [dtab, loadResults]);

  const openAddPS = () => {
    setPsForm({ ...emptyPSForm(), order: psList.length + 1 });
    setPsModal({ open: true });
  };
  const openEditPS = (ps: HackathonPS) => {
    setPsForm({
      title: ps.title,
      description: ps.description,
      techStack: ps.techStack.join(", "),
      difficulty: ps.difficulty,
      isPublished: ps.isPublished,
      order: ps.order,
    });
    setPsModal({ open: true, ps });
  };

  const savePS = async () => {
    setSavingPS(true);
    try {
      const payload = {
        ...psForm,
        techStack: psForm.techStack.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (psModal.ps) {
        await hackathonApi.updatePS(hackathon._id, psModal.ps._id, payload);
        showToast("Problem statement updated", true);
      } else {
        await hackathonApi.createPS(hackathon._id, payload);
        showToast("Problem statement created", true);
      }
      setPsModal({ open: false });
      await loadPS();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setSavingPS(false);
    }
  };

  const deletePS = async (ps: HackathonPS) => {
    if (!window.confirm(`Delete "${ps.title}"?`)) return;
    try {
      await hackathonApi.deletePS(hackathon._id, ps._id);
      showToast("Problem statement deleted", true);
      await loadPS();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-slate-900 text-lg truncate">{hackathon.title}</h2>
          <p className="text-slate-500 text-xs">{hackathon.slug}</p>
        </div>
        <StatusBadge status={hackathon.status} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {(["ps", "teams", "results"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDtab(t)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
              dtab === t
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t === "ps" ? "Problem Statements" : t === "teams" ? "Teams" : "Results"}
          </button>
        ))}
      </div>

      {/* ── PS Tab ──────────────────────────────────────────────────────── */}
      {dtab === "ps" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{psList.length} problem statement(s)</p>
            <button
              onClick={openAddPS}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Add PS
            </button>
          </div>

          {loadingPS ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
          ) : psList.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No problem statements yet.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-bold text-slate-600">#</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Title</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Difficulty</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Locked</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Published</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {psList.map((ps) => (
                    <tr key={ps._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{ps.order}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{ps.title}</td>
                      <td className="px-4 py-3"><DiffBadge diff={ps.difficulty} /></td>
                      <td className="px-4 py-3">
                        {ps.isLocked ? (
                          <span className="flex items-center gap-1 text-amber-600 font-medium text-xs">
                            <Lock className="w-3 h-3" />
                            {ps.lockedByTeam?.teamName ?? "Yes"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ps.isPublished ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditPS(ps)}
                            className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deletePS(ps)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ── Teams Tab ────────────────────────────────────────────────────── */}
      {dtab === "teams" && (
        <div>
          {loadingTeams ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
          ) : teams.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No teams registered yet.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Team Name</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Members</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Selected PS</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{team.teamName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{team.memberEmails.join(", ")}</td>
                      <td className="px-4 py-3">
                        {team.selectedPS ? (
                          <span className="flex items-center gap-1 text-violet-700 font-medium text-xs">
                            <GitBranch className="w-3 h-3" />
                            {typeof team.selectedPS === "object" ? team.selectedPS.title : "Selected"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {team.isSubmitted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Results Tab ────────────────────────────────────────────────── */}
      {dtab === "results" && (
        <div>
          {loadingResults ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {/* Leaderboard */}
              <div>
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
                </h3>
                {leaderboard.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">No scored submissions yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Rank</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Team</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">PS</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Score</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">GitHub</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry) => (
                          <tr key={entry.rank} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-black text-slate-700">#{entry.rank}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{entry.teamName}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{entry.psTitle}</td>
                            <td className="px-4 py-3">
                              <span className={`font-black text-base ${
                                entry.score >= 9 ? "text-green-600" : entry.score >= 8 ? "text-blue-600" : entry.score >= 7 ? "text-amber-600" : "text-slate-500"
                              }`}>
                                {entry.score.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {entry.githubUrl ? (
                                <a href={entry.githubUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-violet-600 hover:underline text-xs font-medium">
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* All submissions */}
              <div>
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" /> All Submissions ({submissions.length})
                </h3>
                {submissions.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">No submissions yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Team</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">PS</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Score</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Scored</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">GitHub</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-800">{sub.team.teamName}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{sub.ps.title}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{sub.isScored ? sub.aiScore.toFixed(1) : "—"}</td>
                            <td className="px-4 py-3">
                              {sub.isScored ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-300" />}
                            </td>
                            <td className="px-4 py-3">
                              {sub.githubUrl ? (
                                <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-violet-600 hover:underline text-xs">
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PS Modal ──────────────────────────────────────────────────────── */}
      {psModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-black text-slate-900">{psModal.ps ? "Edit" : "Add"} Problem Statement</h3>
              <button onClick={() => setPsModal({ open: false })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input value={psForm.title} onChange={(e) => setPsForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea value={psForm.description} onChange={(e) => setPsForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tech Stack (comma-separated)</label>
                <input value={psForm.techStack} onChange={(e) => setPsForm((f) => ({ ...f, techStack: e.target.value }))}
                  placeholder="React, Node.js, MongoDB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Difficulty</label>
                  <select value={psForm.difficulty} onChange={(e) => setPsForm((f) => ({ ...f, difficulty: e.target.value as "Easy" | "Medium" | "Hard" }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Order</label>
                  <input type="number" value={psForm.order} onChange={(e) => setPsForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={psForm.isPublished} onChange={(e) => setPsForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="w-4 h-4 accent-violet-600" />
                <span className="text-sm font-semibold text-slate-700">Published</span>
              </label>
            </div>
            <div className="p-6 pt-0 flex-shrink-0">
              <button onClick={savePS} disabled={savingPS}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all">
                {savingPS ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function HackathonPanel() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selected, setSelected] = useState<Hackathon | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Create/Edit modal
  const [modal, setModal] = useState<{ open: boolean; item?: Hackathon }>({ open: false });
  const [form, setForm] = useState<HForm>(emptyHForm());
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hackathonApi.adminGetAll();
      setHackathons(data.hackathons ?? data ?? []);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyHForm());
    setModal({ open: true });
  };

  const openEdit = (h: Hackathon) => {
    setForm({
      title: h.title,
      slug: h.slug,
      description: h.description,
      theme: h.theme,
      startTime: h.startTime ? h.startTime.slice(0, 16) : "",
      endTime: h.endTime ? h.endTime.slice(0, 16) : "",
      minTeamSize: h.minTeamSize,
      maxTeamSize: h.maxTeamSize,
      prizePool: h.prizePool,
      banner: h.banner || "#6d28d9",
      isPublished: h.isPublished,
    });
    setModal({ open: true, item: h });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal.item) {
        await hackathonApi.update(modal.item._id, form);
        showToast("Hackathon updated", true);
      } else {
        await hackathonApi.create(form);
        showToast("Hackathon created", true);
      }
      setModal({ open: false });
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setSaving(false);
    }
  };

  const del = async (h: Hackathon) => {
    if (!window.confirm(`Delete "${h.title}"?`)) return;
    try {
      await hackathonApi.delete(h._id);
      showToast("Hackathon deleted", true);
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    }
  };

  const handleStart = async (id: string) => {
    setStartingId(id);
    try {
      await hackathonApi.start(id);
      showToast("Hackathon started! Timer is now live.", true);
      await load();
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setStartingId(null);
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <>
        {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
        <HackathonDetail hackathon={selected} onBack={() => setSelected(null)} showToast={showToast} />
      </>
    );
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-black text-slate-900 text-lg">Hackathons</h2>
          <p className="text-slate-500 text-sm">{hackathons.length} hackathon(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> New Hackathon
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
      ) : hackathons.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No hackathons yet.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-bold text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600">Start</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600">End</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600">Published</th>
                <th className="text-right px-4 py-3 font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hackathons.map((h) => (
                <tr key={h._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{h.title}</td>
                  <td className="px-4 py-3">
                    {h.isStarted && h.status === "active"
                      ? <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live</span>
                      : h.isStarted && h.status === "ended"
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Ended</span>
                      : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Not Started</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(h.startTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(h.endTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {h.isPublished ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-300" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!h.isStarted && h.isPublished && (
                        <button
                          onClick={() => handleStart(h._id)}
                          disabled={startingId === h._id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {startingId === h._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          Start
                        </button>
                      )}
                      <button onClick={() => openEdit(h)}
                        className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(h)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setSelected(h)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-black text-slate-900">{modal.item ? "Edit" : "Create"} Hackathon</h3>
              <button onClick={() => setModal({ open: false })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Slug</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Theme</label>
                <input value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
                  placeholder="e.g. MERN Stack, AI/ML"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Time</label>
                  <input type="datetime-local" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Time</label>
                  <input type="datetime-local" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Min Team Size</label>
                  <input type="number" min={1} value={form.minTeamSize} onChange={(e) => setForm((f) => ({ ...f, minTeamSize: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Team Size</label>
                  <input type="number" min={1} value={form.maxTeamSize} onChange={(e) => setForm((f) => ({ ...f, maxTeamSize: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Prize Pool</label>
                <input value={form.prizePool} onChange={(e) => setForm((f) => ({ ...f, prizePool: e.target.value }))}
                  placeholder="e.g. ₹50,000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Banner Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.banner} onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                  <input value={form.banner} onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="w-4 h-4 accent-violet-600" />
                <span className="text-sm font-semibold text-slate-700">Published</span>
              </label>
            </div>

            <div className="p-6 pt-0 flex-shrink-0">
              <button onClick={save} disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : modal.item ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
