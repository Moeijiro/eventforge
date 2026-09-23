"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, Plus, Calendar, Users, ArrowRight, Sparkles, 
  GitBranch, CheckCircle2, Clock 
} from "lucide-react";
import { api, Tournament } from "@/lib/api";

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [format, setFormat] = useState("single_elimination");
  const [maxP, setMaxP] = useState(16);

  useEffect(() => {
    loadTournaments();
  }, []);

  async function loadTournaments() {
    setLoading(true);
    try {
      const data = await api.getTournaments("tourn-demo-777");
      setTournaments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedDemo() {
    setSeeding(true);
    try {
      await api.seedDemo();
      await loadTournaments();
    } catch (err) {
      alert("Failed to seed demo tournament.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const now = new Date();
      now.setDate(now.getDate() + 3);
      await api.createTournament("tourn-demo-777", {
        title,
        description: desc,
        format,
        max_participants: maxP,
        start_time: now.toISOString(),
      });
      setShowCreateModal(false);
      setTitle("");
      setDesc("");
      await loadTournaments();
    } catch (err) {
      alert("Failed to create tournament.");
    }
  }

  return (
    <div className="space-y-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-400" />
            Tournament Hub
          </h1>
          <p className="text-xs text-zinc-400">
            Active bracket championships and leagues for <strong className="text-white">Apex Community League</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {seeding ? "Seeding..." : "Seed 8-Player Demo"}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition glow-purple"
          >
            <Plus className="w-4 h-4" />
            New Tournament
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-400 font-mono">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-8 space-y-3">
          <Trophy className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No active tournaments</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Click &quot;Seed 8-Player Demo&quot; or create a new tournament to start bracket management.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 transition flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border bg-purple-500/10 text-purple-400 border-purple-500/30">
                    {t.format.replace("_", " ")}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {t.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-white">{t.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{t.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-800/60">
                <span className="flex items-center gap-1.5 text-zinc-400 font-mono">
                  <Users className="w-3.5 h-3.5" />
                  {t.participants_count} / {t.max_participants} Players
                </span>

                <Link
                  href={`/tournaments/${t.id}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-purple-400 text-xs font-semibold flex items-center gap-1 transition"
                >
                  View Bracket <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              Schedule Tournament
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Tournament Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apex Autumn Invitational"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Description</label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Tournament rules and details..."
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="single_elimination">Single Elimination</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Max Capacity</label>
                <select
                  value={maxP}
                  onChange={(e) => setMaxP(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={8}>8 Players</option>
                  <option value={16}>16 Players</option>
                  <option value={32}>32 Players</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Create Tournament
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
