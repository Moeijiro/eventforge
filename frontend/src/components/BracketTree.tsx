"use client";

import { Match } from "@/lib/api";
import { Trophy, Check, AlertTriangle } from "lucide-react";

interface BracketTreeProps {
  matches: Match[];
  onSelectMatch?: (match: Match) => void;
}

export default function BracketTree({ matches, onSelectMatch }: BracketTreeProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500 font-mono">
        Bracket has not been generated yet.
      </div>
    );
  }

  // Group matches by round
  const roundsMap: Record<number, Match[]> = {};
  for (const m of matches) {
    if (!roundsMap[m.round_number]) roundsMap[m.round_number] = [];
    roundsMap[m.round_number].push(m);
  }

  const roundNumbers = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto py-6">
      <div className="flex gap-10 min-w-max items-center justify-start px-4">
        {roundNumbers.map((rNum) => {
          const roundMatches = roundsMap[rNum];
          const isFinal = rNum === roundNumbers[roundNumbers.length - 1];
          const roundName = isFinal
            ? "Championship Final"
            : rNum === roundNumbers[roundNumbers.length - 2]
            ? "Semifinals"
            : `Round ${rNum}`;

          return (
            <div key={rNum} className="flex flex-col justify-around gap-6 w-64">
              <div className="text-center pb-2 border-b border-zinc-800">
                <span className="text-xs font-mono font-bold uppercase text-purple-400">
                  {roundName}
                </span>
              </div>

              <div className="flex flex-col justify-around gap-8 h-full">
                {roundMatches.map((match) => {
                  const isCompleted = match.status === "completed";
                  const isAwaiting = match.status === "awaiting_confirmation";
                  const isDisputed = match.status === "disputed";

                  const aWon = match.winner_id && match.winner_id === match.participant_a_id;
                  const bWon = match.winner_id && match.winner_id === match.participant_b_id;

                  return (
                    <div
                      key={match.id}
                      onClick={() => onSelectMatch && onSelectMatch(match)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-2 bg-zinc-900/60 shadow-md ${
                        isDisputed
                          ? "border-rose-500/80 bg-rose-950/20"
                          : isAwaiting
                          ? "border-amber-500/80 bg-amber-950/20"
                          : "border-zinc-800 hover:border-purple-500/60"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                        <span>Match #{match.match_number}</span>
                        {isCompleted && <span className="text-emerald-400 font-bold">COMPLETED</span>}
                        {isAwaiting && <span className="text-amber-400 font-bold">CONFIRMATION</span>}
                        {isDisputed && <span className="text-rose-400 font-bold">DISPUTED</span>}
                      </div>

                      {/* Participant A */}
                      <div
                        className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                          aWon
                            ? "bg-purple-950/40 text-purple-300 font-bold border border-purple-500/30"
                            : "bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        <span className="truncate">{match.participant_a_name || "TBD"}</span>
                        <span className="font-mono">{match.score_a}</span>
                      </div>

                      {/* Participant B */}
                      <div
                        className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                          bWon
                            ? "bg-purple-950/40 text-purple-300 font-bold border border-purple-500/30"
                            : "bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        <span className="truncate">{match.participant_b_name || "TBD"}</span>
                        <span className="font-mono">{match.score_b}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
