export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export const DEMO_GUILD = "tourn-demo-777";
export const DEMO_GUILD_NAME = "Apex Arena";

export interface Participant {
  id: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  seed: number;
  is_checked_in: boolean;
  joined_at: string;
}

export type TournamentStatus = "registration_open" | "check_in_open" | "in_progress" | "completed" | "cancelled";
export type Format = "single_elimination" | "round_robin";

export interface Tournament {
  id: number;
  guild_id: string;
  title: string;
  description: string;
  format: Format;
  max_participants: number;
  status: TournamentStatus;
  start_time: string;
  winner_id: string | null;
  winner_name: string | null;
  created_at: string;
  participants_count: number;
}

export type MatchStatus = "scheduled" | "in_progress" | "awaiting_confirmation" | "disputed" | "completed";

export interface Match {
  id: number;
  tournament_id: number;
  round_number: number;
  match_number: number;
  participant_a_id: string | null;
  participant_a_name: string | null;
  participant_b_id: string | null;
  participant_b_name: string | null;
  score_a: number;
  score_b: number;
  winner_id: string | null;
  winner_name: string | null;
  status: MatchStatus;
  reported_by: string | null;
  confirmed_by: string | null;
}

export type NewTournament = { title: string; description: string; format: Format; max_participants: number; start_time: string };

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: init?.body ? { "Content-Type": "application/json" } : undefined });
  } catch {
    throw new ApiError("Can't reach the EventForge API. Is the backend running on port 8000?", 0);
  }
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = String(data.detail[0].msg);
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

const post = (body?: unknown): RequestInit => ({ method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  getTournaments: (guild = DEMO_GUILD) => request<Tournament[]>(`/tournaments/${guild}`),
  getTournament: (id: number, guild = DEMO_GUILD) => request<{ tournament: Tournament; participants: Participant[] }>(`/tournaments/${guild}/${id}`),
  createTournament: (data: NewTournament, guild = DEMO_GUILD) => request<Tournament>(`/tournaments/${guild}`, post(data)),
  joinTournament: (id: number, user: { user_id: string; username: string }, guild = DEMO_GUILD) => request<Participant>(`/tournaments/${guild}/${id}/join`, post(user)),
  generateBracket: (id: number, guild = DEMO_GUILD) => request<{ total_matches: number }>(`/tournaments/${guild}/${id}/generate-bracket`, post()),
  getMatches: (id: number, guild = DEMO_GUILD) => request<Match[]>(`/tournaments/${guild}/${id}/matches`),
  submitScore: (matchId: number, reporterId: string, scoreA: number, scoreB: number) =>
    request<Match>(`/matches/${matchId}/submit`, post({ reporter_id: reporterId, score_a: scoreA, score_b: scoreB })),
  confirmScore: (matchId: number, confirmerId: string) => request<Match>(`/matches/${matchId}/confirm`, post({ confirmer_id: confirmerId })),
  disputeScore: (matchId: number, disputerId: string) => request<Match>(`/matches/${matchId}/dispute`, post({ disputer_id: disputerId })),
  override: (matchId: number, winnerId: string) => request<Match>(`/matches/${matchId}/override`, post({ winner_id: winnerId })),
  seedDemo: () => request<{ message: string; created: boolean }>(`/demo/seed`, post()),
};
