import { Pill } from "@/components/kit/ui";
import type { MatchStatus, TournamentStatus } from "@/lib/api";
import { MATCH_STATUS, TOURNAMENT_STATUS } from "@/lib/format";

export function TournamentStatusPill({ status }: { status: TournamentStatus }) {
  const s = TOURNAMENT_STATUS[status] ?? { label: status, tone: "muted" as const };
  return <Pill tone={s.tone} pulse={status === "in_progress"}>{s.label}</Pill>;
}

export function MatchStatusPill({ status }: { status: MatchStatus }) {
  const s = MATCH_STATUS[status] ?? { label: status, tone: "muted" as const };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

/** Initials in an accent circle — no remote avatar service needed. */
export function PlayerAvatar({ name, className = "size-7 text-[11px]" }: { name: string; className?: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${className}`}>{name.slice(0, 2).toUpperCase()}</span>;
}
