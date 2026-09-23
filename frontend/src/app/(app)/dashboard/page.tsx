"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarClock, Crown, Plus, Radio, Sparkles, Trophy, Users } from "lucide-react";
import { NewTournamentDialog } from "@/components/new-tournament";
import { TournamentStatusPill } from "@/components/event";
import { Empty, ErrorState, PageLoading, PageTitle, Stat, Tag } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { api, DEMO_GUILD_NAME, type Tournament } from "@/lib/api";
import { formatDateTime, FORMAT_LABEL } from "@/lib/format";

function TournamentCard({ t }: { t: Tournament }) {
  const fill = Math.round((t.participants_count / t.max_participants) * 100);
  return (
    <Link href={`/tournaments/${t.id}`} className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <TournamentStatusPill status={t.status} />
        <Tag>{FORMAT_LABEL[t.format] ?? t.format}</Tag>
      </div>
      <h2 className="mt-4 font-semibold tracking-tight group-hover:text-primary">{t.title}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
      <div className="mt-auto space-y-3 pt-5">
        {t.winner_name ? (
          <p className="flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2 text-sm"><Crown className="size-4 text-ok" />Champion: <strong className="font-medium">{t.winner_name}</strong></p>
        ) : null}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Players</span><span className="tabular">{t.participants_count} / {t.max_participants}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} /></div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />{formatDateTime(t.start_time)}</p>
      </div>
    </Link>
  );
}

export default function TournamentsPage() {
  const tournaments = useApi(() => api.getTournaments(), "tournaments");
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function seed() {
    setSeeding(true);
    try {
      const result = await api.seedDemo();
      toast.success(result.created ? result.message : "Demo tournaments are already loaded");
      tournaments.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  const list = tournaments.data ?? [];
  const live = list.filter((t) => t.status === "in_progress").length;
  const open = list.filter((t) => t.status === "registration_open" || t.status === "check_in_open").length;
  const finished = list.filter((t) => t.status === "completed").length;
  const players = list.reduce((sum, t) => sum + t.participants_count, 0);

  return (
    <>
      <PageTitle title="Tournaments" description={<>Brackets and leagues running on the <strong className="font-medium text-foreground">{DEMO_GUILD_NAME}</strong> Discord server.</>}
        actions={<>
          <Button variant="outline" onClick={seed} disabled={seeding}><Sparkles />{seeding ? "Loading…" : "Load demo"}</Button>
          <Button onClick={() => setCreating(true)}><Plus />New tournament</Button>
        </>} />

      {tournaments.error ? <ErrorState message={tournaments.error} onRetry={tournaments.reload} /> : !tournaments.data ? <PageLoading /> : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Live now" icon={Radio} value={live} tone={live ? "run" : undefined} />
            <Stat label="Open for sign-ups" icon={Users} value={open} />
            <Stat label="Finished" icon={Trophy} value={finished} tone={finished ? "ok" : undefined} />
            <Stat label="Registered players" icon={Users} value={players} hint="Across all tournaments" />
          </div>
          {list.length === 0 ? (
            <div className="rounded-xl border bg-card">
              <Empty icon={Trophy} title="No tournaments yet" description="Load the demo — a live knockout, a cup taking sign-ups and a finished league — or create your own."
                action={<Button onClick={seed} disabled={seeding}><Sparkles />Load demo</Button>} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((t) => <TournamentCard key={t.id} t={t} />)}
            </div>
          )}
        </>
      )}

      <NewTournamentDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
