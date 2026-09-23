import type { Tone } from "@/components/kit/ui";
import type { Format, Match, MatchStatus, TournamentStatus } from "@/lib/api";

export function parseUTC(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export function formatDateTime(value: string): string {
  return parseUTC(value).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(value: string): string {
  return parseUTC(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const TOURNAMENT_STATUS: Record<TournamentStatus, { label: string; tone: Tone }> = {
  registration_open: { label: "Sign-ups open", tone: "primary" },
  check_in_open: { label: "Check-in", tone: "warn" },
  in_progress: { label: "Live", tone: "run" },
  completed: { label: "Finished", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export const MATCH_STATUS: Record<MatchStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "muted" },
  in_progress: { label: "Playing", tone: "run" },
  awaiting_confirmation: { label: "Awaiting confirmation", tone: "warn" },
  disputed: { label: "Disputed", tone: "fail" },
  completed: { label: "Final", tone: "ok" },
};

export const FORMAT_LABEL: Record<Format, string> = {
  single_elimination: "Single elimination",
  round_robin: "Round robin",
};

/** "Final", "Semi-finals", "Quarter-finals", else "Round n". */
export function roundName(round: number, totalRounds: number, format: Format): string {
  if (format === "round_robin") return `Round ${round}`;
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semi-finals";
  if (fromEnd === 2) return "Quarter-finals";
  return `Round ${round}`;
}

export function isBye(match: Match): boolean {
  return match.participant_a_name === "BYE" || match.participant_b_name === "BYE";
}

export type Standing = { id: string; name: string; played: number; wins: number; losses: number; draws: number; diff: number };

export function standings(matches: Match[]): Standing[] {
  const table = new Map<string, Standing>();
  const row = (id: string, name: string) => {
    if (!table.has(id)) table.set(id, { id, name, played: 0, wins: 0, losses: 0, draws: 0, diff: 0 });
    return table.get(id)!;
  };
  for (const m of matches) {
    if (!m.participant_a_id || !m.participant_b_id) continue;
    const a = row(m.participant_a_id, m.participant_a_name ?? "?");
    const b = row(m.participant_b_id, m.participant_b_name ?? "?");
    if (m.status !== "completed") continue;
    a.played++; b.played++;
    a.diff += m.score_a - m.score_b; b.diff += m.score_b - m.score_a;
    if (m.winner_id === a.id) { a.wins++; b.losses++; }
    else if (m.winner_id === b.id) { b.wins++; a.losses++; }
    else { a.draws++; b.draws++; }
  }
  return [...table.values()].sort((x, y) => y.wins - x.wins || y.diff - x.diff || x.name.localeCompare(y.name));
}
