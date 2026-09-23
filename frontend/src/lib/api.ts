const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface Participant {
  id: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  seed: number;
  is_checked_in: boolean;
  joined_at: string;
}

export interface Tournament {
  id: number;
  guild_id: string;
  title: string;
  description: string;
  format: string;
  max_participants: number;
  status: "registration_open" | "check_in_open" | "in_progress" | "completed" | "cancelled";
  start_time: string;
  winner_id: string | null;
  winner_name: string | null;
  created_at: string;
  participants_count: number;
}

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
  status: "scheduled" | "in_progress" | "awaiting_confirmation" | "disputed" | "completed";
  reported_by: string | null;
  confirmed_by: string | null;
}

export const api = {
  async getTournaments(guildId: string = "tourn-demo-777"): Promise<Tournament[]> {
    const res = await fetch(`${API_URL}/tournaments/${guildId}`);
    if (!res.ok) throw new Error("Failed to load tournaments.");
    return res.json();
  },

  async getTournament(guildId: string = "tourn-demo-777", id: number): Promise<{ tournament: Tournament; participants: Participant[] }> {
    const res = await fetch(`${API_URL}/tournaments/${guildId}/${id}`);
    if (!res.ok) throw new Error("Failed to load tournament detail.");
    return res.json();
  },

  async createTournament(guildId: string = "tourn-demo-777", data: Partial<Tournament>): Promise<Tournament> {
    const res = await fetch(`${API_URL}/tournaments/${guildId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create tournament.");
    return res.json();
  },

  async joinTournament(guildId: string = "tourn-demo-777", id: number, user: { user_id: string; username: string }): Promise<Participant> {
    const res = await fetch(`${API_URL}/tournaments/${guildId}/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error("Failed to join tournament.");
    return res.json();
  },

  async generateBracket(guildId: string = "tourn-demo-777", id: number): Promise<void> {
    const res = await fetch(`${API_URL}/tournaments/${guildId}/${id}/generate-bracket`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to generate bracket.");
  },

  async getMatches(guildId: string = "tourn-demo-777", id: number): Promise<Match[]> {
    const res = await fetch(`${API_URL}/tournaments/${guildId}/${id}/matches`);
    if (!res.ok) throw new Error("Failed to load bracket matches.");
    return res.json();
  },

  async submitScore(matchId: number, reporterId: string, scoreA: number, scoreB: number): Promise<Match> {
    const res = await fetch(`${API_URL}/matches/${matchId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporter_id: reporterId, score_a: scoreA, score_b: scoreB }),
    });
    if (!res.ok) throw new Error("Failed to submit score.");
    return res.json();
  },

  async confirmScore(matchId: number, confirmerId: string): Promise<Match> {
    const res = await fetch(`${API_URL}/matches/${matchId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmer_id: confirmerId }),
    });
    if (!res.ok) throw new Error("Failed to confirm score.");
    return res.json();
  },

  async seedDemo(): Promise<void> {
    const res = await fetch(`${API_URL}/demo/seed`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed demo tournament.");
  },
};
