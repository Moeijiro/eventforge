"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Trophy, Users, GitBranch, Play, CheckCircle2, 
  AlertTriangle, Shield, Check, Send 
} from "lucide-react";
import { api, Tournament, Participant, Match } from "@/lib/api";
import BracketTree from "@/components/BracketTree";

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = Number(params?.id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected match modal for reporting/confirming scores
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreA, setScoreA] = useState(2);
  const [scoreB, setScoreB] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    loadAll();
  }, [tournamentId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [tData, mData] = await Promise.all([
        api.getTournament("tourn-demo-777", tournamentId),
        api.getMatches("tourn-demo-777", tournamentId),
      ]);
      setTournament(tData.tournament);
      setParticipants(tData.participants);
      setMatches(mData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateBracket() {
    try {
      await api.generateBracket("tourn-demo-777", tournamentId);
      await loadAll();
    } catch (err) {
      alert("Failed to generate bracket.");
    }
  }

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    try {
      // Submit as participant A or first available
      const reporter = selectedMatch.participant_a_id || "p_1";
      await api.submitScore(selectedMatch.id, reporter, scoreA, scoreB);
      setSelectedMatch(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to submit score.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmScore() {
    if (!selectedMatch) return;
    setSubmitting(true);
    try {
      const confirmer = selectedMatch.participant_b_id || "p_2";
      await api.confirmScore(selectedMatch.id, confirmer);
      setSelectedMatch(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to confirm score.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Loading tournament bracket...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Tournament not found</h2>
        <Link href="/dashboard" className="text-xs text-purple-400 hover:underline">
          Return to Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner */}
      <div className="space-y-3 border-b border-zinc-800/80 pb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tournaments
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{tournament.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border bg-purple-500/10 text-purple-400 border-purple-500/30">
                {tournament.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{tournament.description}</p>
          </div>

          {tournament.status === "registration_open" && matches.length === 0 && (
            <button
              onClick={handleGenerateBracket}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition glow-purple shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Generate Bracket
            </button>
          )}

          {tournament.winner_name && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-400 text-xs font-bold font-mono shrink-0">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>CHAMPION: {tournament.winner_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bracket Tree Container */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-400" />
            Interactive Bracket Tree
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            Click any match card to submit / confirm scores
          </span>
        </div>

        <BracketTree matches={matches} onSelectMatch={setSelectedMatch} />
      </div>

      {/* Match Score Submission & Confirmation Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">
                  Round {selectedMatch.round_number} — Match #{selectedMatch.match_number}
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Status: {selectedMatch.status}</span>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {selectedMatch.status === "awaiting_confirmation" ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs space-y-1">
                  <p className="font-bold">Score Submitted: {selectedMatch.score_a} – {selectedMatch.score_b}</p>
                  <p className="text-[11px] text-zinc-400">
                    Awaiting opponent confirmation to verify match outcome and advance winner.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleConfirmScore}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {submitting ? "Confirming..." : "Confirm & Advance Winner"}
                  </button>
                </div>
              </div>
            ) : selectedMatch.status === "completed" ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="font-bold text-sm text-white">Winner: {selectedMatch.winner_name}</p>
                <p className="text-xs text-zinc-400 font-mono">Final Score: {selectedMatch.score_a} – {selectedMatch.score_b}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitScore} className="space-y-4">
                <p className="text-xs text-zinc-400">Submit match score between opponents:</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="font-semibold text-xs text-white block truncate">
                      {selectedMatch.participant_a_name || "TBD"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={scoreA}
                      onChange={(e) => setScoreA(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-center text-sm font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="font-semibold text-xs text-white block truncate">
                      {selectedMatch.participant_b_name || "TBD"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={scoreB}
                      onChange={(e) => setScoreB(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-center text-sm font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? "Submitting..." : "Submit Score"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
