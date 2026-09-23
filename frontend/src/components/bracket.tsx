import { Crown } from "lucide-react";
import type { Format, Match } from "@/lib/api";
import { isBye, MATCH_STATUS, roundName } from "@/lib/format";
import { cn } from "@/lib/utils";

function Slot({ name, score, won, done, bye }: { name: string | null; score: number; won: boolean; done: boolean; bye: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 px-3 py-2 text-sm", won && "bg-ok/10")}>
      <span className={cn("truncate", !name && "text-muted-foreground italic", won && "font-semibold", name === "BYE" && "text-muted-foreground")}>{name ?? "TBD"}</span>
      {done && !bye ? <span className={cn("font-mono text-xs tabular", won ? "font-semibold text-ok" : "text-muted-foreground")}>{score}</span> : null}
      {won && bye ? <span className="text-[11px] text-muted-foreground">bye</span> : null}
    </div>
  );
}

export function MatchCard({ match: m, onOpen }: { match: Match; onOpen: (m: Match) => void }) {
  const done = m.status === "completed";
  const bye = isBye(m);
  const tone = MATCH_STATUS[m.status]?.tone ?? "muted";
  const reported = m.status === "awaiting_confirmation" || m.status === "disputed";
  return (
    <button type="button" onClick={() => onOpen(m)} disabled={bye}
      className="w-full overflow-hidden rounded-lg border bg-card text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors enabled:hover:border-primary/50 disabled:opacity-70">
      <div className="divide-y">
        <Slot name={m.participant_a_name} score={m.score_a} won={done && m.winner_id !== null && m.winner_id === m.participant_a_id} done={done || reported} bye={bye} />
        <Slot name={m.participant_b_name} score={m.score_b} won={done && m.winner_id !== null && m.winner_id === m.participant_b_id} done={done || reported} bye={bye} />
      </div>
      {!done ? (
        <div className="border-t px-3 py-1 text-[11px] font-medium" style={{ color: `var(--${tone === "muted" ? "muted-foreground" : tone})` }}>{MATCH_STATUS[m.status]?.label}</div>
      ) : null}
    </button>
  );
}

/** Rounds as columns; each later round's cards are centred between the two they come from. */
export function Bracket({ matches, format, champion, onOpen }: { matches: Match[]; format: Format; champion: string | null; onOpen: (m: Match) => void }) {
  const rounds = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b);
  const total = rounds.length;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {rounds.map((round) => {
          const inRound = matches.filter((m) => m.round_number === round).sort((a, b) => a.match_number - b.match_number);
          return (
            <section key={round} className="flex w-56 flex-col">
              <h3 className="mb-3 text-xs font-medium text-muted-foreground">{roundName(round, total, format)}</h3>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {inRound.map((m) => <MatchCard key={m.id} match={m} onOpen={onOpen} />)}
              </div>
            </section>
          );
        })}
        <section className="flex w-44 flex-col">
          <h3 className="mb-3 text-xs font-medium text-muted-foreground">Champion</h3>
          <div className="flex flex-1 items-center">
            <div className={cn("flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-sm", champion ? "border-ok/40 bg-ok/10 font-semibold" : "border-dashed text-muted-foreground")}>
              <Crown className={cn("size-4", champion ? "text-ok" : "")} />{champion ?? "To be decided"}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
