"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, GitFork, ListOrdered, Swords, UserPlus, Users } from "lucide-react";
import { Bracket, MatchCard } from "@/components/bracket";
import { PlayerAvatar, TournamentStatusPill } from "@/components/event";
import { Empty, ErrorState, PageLoading, PageTitle, Panel, Stat, Table, Tag, Td, Th } from "@/components/kit/ui";
import { MatchDialog } from "@/components/match-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { api, type Match } from "@/lib/api";
import { formatDate, formatDateTime, FORMAT_LABEL, standings } from "@/lib/format";

export default function TournamentPage() {
  const id = Number(useParams<{ id: string }>().id);
  const data = useApi(() => Promise.all([api.getTournament(id), api.getMatches(id)]), String(id));
  const [open, setOpen] = useState<Match | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return <PageLoading />;
  const [{ tournament: t, participants }, matches] = data.data;
  const signups = t.status === "registration_open" || t.status === "check_in_open";
  const played = matches.filter((m) => m.status === "completed" && m.participant_a_name !== "BYE" && m.participant_b_name !== "BYE").length;
  const real = matches.filter((m) => m.participant_a_name !== "BYE" && m.participant_b_name !== "BYE").length;
  const pending = matches.filter((m) => m.status === "awaiting_confirmation" || m.status === "disputed").length;

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      data.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const username = name.trim();
    if (!username) return;
    await act(() => api.joinTournament(t.id, { user_id: `u_${username.toLowerCase().replace(/\W+/g, "_")}`, username }), `${username} joined`);
    setName("");
  }

  return (
    <>
      <PageTitle
        eyebrow={<Link href="/dashboard" className="hover:text-foreground">Tournaments</Link>}
        title={t.title}
        description={<span className="flex flex-wrap items-center gap-2"><TournamentStatusPill status={t.status} /><Tag>{FORMAT_LABEL[t.format]}</Tag><span>{t.description}</span></span>}
        actions={signups ? (
          <Button onClick={() => act(() => api.generateBracket(t.id), t.format === "round_robin" ? "Schedule generated — the league is live" : "Bracket generated — the tournament is live")} disabled={busy || participants.length < 2}>
            <GitFork />{t.format === "round_robin" ? "Generate schedule" : "Generate bracket"}
          </Button>
        ) : undefined} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Players" icon={Users} value={`${participants.length} / ${t.max_participants}`} />
        <Stat label="Matches played" icon={Swords} value={matches.length ? `${played} / ${real}` : "—"} hint={pending ? `${pending} waiting for a decision` : undefined} tone={pending ? "warn" : undefined} />
        <Stat label="Starts" icon={CalendarClock} value={<span className="text-xl">{formatDateTime(t.start_time)}</span>} />
        <Stat label="Champion" icon={ListOrdered} value={<span className="text-xl">{t.winner_name ?? "—"}</span>} tone={t.winner_name ? "ok" : undefined} />
      </div>

      <Tabs defaultValue={matches.length ? "bracket" : "players"}>
        <TabsList>
          <TabsTrigger value="bracket"><GitFork />{t.format === "round_robin" ? "Schedule" : "Bracket"}</TabsTrigger>
          {t.format === "round_robin" ? <TabsTrigger value="standings"><ListOrdered />Standings</TabsTrigger> : null}
          <TabsTrigger value="players"><Users />Players ({participants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bracket" className="mt-3">
          <Panel bodyClassName="p-5">
            {matches.length === 0 ? (
              <Empty icon={GitFork} title="No bracket yet" description={participants.length < 2 ? "At least two players need to sign up first." : "Close sign-ups and seed the players with Generate bracket."} />
            ) : t.format === "round_robin" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b).map((r) => (
                  <section key={r} className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground">Round {r}</h3>
                    {matches.filter((m) => m.round_number === r).map((m) => <MatchCard key={m.id} match={m} onOpen={setOpen} />)}
                  </section>
                ))}
              </div>
            ) : (
              <Bracket matches={matches} format={t.format} champion={t.winner_name} onOpen={setOpen} />
            )}
            {matches.length ? <p className="mt-4 text-xs text-muted-foreground">Select a match to report a score, confirm or dispute it, or settle a dispute as staff.</p> : null}
          </Panel>
        </TabsContent>

        {t.format === "round_robin" ? (
          <TabsContent value="standings" className="mt-3">
            <Panel bodyClassName="p-0">
              <Table>
                <thead><tr><Th>#</Th><Th>Player</Th><Th className="text-right">Played</Th><Th className="text-right">W</Th><Th className="text-right">D</Th><Th className="text-right">L</Th><Th className="text-right">Diff</Th></tr></thead>
                <tbody>
                  {standings(matches).map((s, i) => (
                    <tr key={s.id} className={i === 0 && t.status === "completed" ? "bg-ok/5" : undefined}>
                      <Td className="w-10 font-mono text-xs text-muted-foreground">{i + 1}</Td>
                      <Td><span className="flex items-center gap-2"><PlayerAvatar name={s.name} />{s.name}</span></Td>
                      <Td className="text-right tabular">{s.played}</Td>
                      <Td className="text-right font-medium tabular">{s.wins}</Td>
                      <Td className="text-right tabular">{s.draws}</Td>
                      <Td className="text-right tabular">{s.losses}</Td>
                      <Td className="text-right tabular">{s.diff > 0 ? `+${s.diff}` : s.diff}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
          </TabsContent>
        ) : null}

        <TabsContent value="players" className="mt-3">
          <Panel bodyClassName="p-0">
            {signups ? (
              <form onSubmit={join} className="flex flex-col gap-2 border-b p-4 sm:flex-row">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Discord username" maxLength={64} aria-label="Player name" />
                <Button type="submit" disabled={busy || !name.trim() || participants.length >= t.max_participants}><UserPlus />Sign up player</Button>
              </form>
            ) : null}
            {participants.length === 0 ? <Empty icon={Users} title="No players yet" description="Players sign up from the tournament panel in Discord." /> : (
              <ol className="divide-y">
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-8 font-mono text-xs text-muted-foreground">#{p.seed}</span>
                    <PlayerAvatar name={p.username} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.username}</span>
                    {t.winner_id === p.user_id ? <Tag className="border-ok/30 bg-ok/10 text-ok">Champion</Tag> : null}
                    <span className="hidden text-xs text-muted-foreground sm:block">joined {formatDate(p.joined_at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <MatchDialog match={open} format={t.format} onClose={() => setOpen(null)} onChanged={data.reload} />
    </>
  );
}
