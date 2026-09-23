"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Crown, Flag, Gavel } from "lucide-react";
import { MatchStatusPill } from "@/components/event";
import { SelectField } from "@/components/kit/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type Format, type Match } from "@/lib/api";

/**
 * The match card's actions, as a player or staff would take them in Discord:
 * one player reports, the other confirms or disputes, staff settle disputes.
 */
export function MatchDialog({ match, format, onClose, onChanged }: { match: Match | null; format: Format; onClose: () => void; onChanged: () => void }) {
  return (
    <Dialog open={match !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {match ? <MatchBody key={`${match.id}-${match.status}`} match={match} format={format} onDone={() => { onChanged(); onClose(); }} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function MatchBody({ match: m, format, onDone }: { match: Match; format: Format; onDone: () => void }) {
  const a = { id: m.participant_a_id, name: m.participant_a_name ?? "TBD" };
  const b = { id: m.participant_b_id, name: m.participant_b_name ?? "TBD" };
  const [reporter, setReporter] = useState(a.id ?? "");
  const [scoreA, setScoreA] = useState(String(m.status === "awaiting_confirmation" || m.status === "disputed" ? m.score_a : 2));
  const [scoreB, setScoreB] = useState(String(m.status === "awaiting_confirmation" || m.status === "disputed" ? m.score_b : 1));
  const [busy, setBusy] = useState(false);
  const ready = Boolean(a.id && b.id);
  const opponent = m.reported_by === a.id ? b : a;
  const reporterName = m.reported_by === a.id ? a.name : b.name;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{a.name} vs {b.name}</DialogTitle>
        <DialogDescription className="flex items-center gap-2">Round {m.round_number} · match {m.match_number} <MatchStatusPill status={m.status} /></DialogDescription>
      </DialogHeader>

      {!ready ? (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">Waiting for the previous round to decide who plays here.</p>
      ) : m.status === "completed" ? (
        <div className="space-y-3">
          <Scoreline a={a.name} b={b.name} sa={m.score_a} sb={m.score_b} winner={m.winner_name} />
          <p className="flex items-center gap-2 text-sm"><Crown className="size-4 text-ok" />{m.winner_name ? <><strong className="font-medium">{m.winner_name}</strong> won{m.confirmed_by ? ", confirmed by the opponent" : " by staff decision"}.</> : "Draw."}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {m.status === "awaiting_confirmation" ? (
            <section className="space-y-3 rounded-xl border border-warn/30 bg-warn/5 p-4">
              <Scoreline a={a.name} b={b.name} sa={m.score_a} sb={m.score_b} />
              <p className="text-sm text-muted-foreground"><strong className="font-medium text-foreground">{reporterName}</strong> reported this score. {opponent.name} confirms or disputes it.</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => run(() => api.confirmScore(m.id, opponent.id!), "Result confirmed")}><Check />Confirm as {opponent.name}</Button>
                <Button variant="outline" disabled={busy} onClick={() => run(() => api.disputeScore(m.id, opponent.id!), "Result disputed — staff will review")}><Flag />Dispute</Button>
              </div>
            </section>
          ) : null}

          {m.status === "disputed" ? (
            <section className="space-y-3 rounded-xl border border-fail/30 bg-fail/5 p-4">
              <Scoreline a={a.name} b={b.name} sa={m.score_a} sb={m.score_b} />
              <p className="flex items-center gap-2 text-sm"><Gavel className="size-4 text-fail" />The players disagree. Staff decide the winner:</p>
              <div className="flex flex-wrap gap-2">
                {[a, b].map((p) => <Button key={p.id} variant="outline" disabled={busy} onClick={() => run(() => api.override(m.id, p.id!), `${p.name} advances`)}>{p.name} wins</Button>)}
              </div>
            </section>
          ) : null}

          {m.status !== "awaiting_confirmation" ? (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => api.submitScore(m.id, reporter, Number(scoreA), Number(scoreB)), "Score reported — waiting for the opponent"); }}>
              <p className="text-sm font-medium">{m.status === "disputed" ? "Or report a corrected score" : "Report the result"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="sa">{a.name}</Label><Input id="sa" type="number" min={0} max={99} required value={scoreA} onChange={(e) => setScoreA(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="sb">{b.name}</Label><Input id="sb" type="number" min={0} max={99} required value={scoreB} onChange={(e) => setScoreB(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="rep">Reported by</Label><SelectField id="rep" label="Reported by" value={reporter} onChange={setReporter} options={[{ value: a.id!, label: a.name }, { value: b.id!, label: b.name }]} /></div>
              {format === "single_elimination" ? <p className="text-xs text-muted-foreground">Knockout matches can&apos;t end in a draw.</p> : null}
              <Button type="submit" disabled={busy} className="w-full">Submit score</Button>
            </form>
          ) : null}
        </div>
      )}
    </>
  );
}

function Scoreline({ a, b, sa, sb, winner }: { a: string; b: string; sa: number; sb: number; winner?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-card px-4 py-3 text-sm">
      <span className={`truncate ${winner === a ? "font-semibold" : ""}`}>{a}</span>
      <span className="font-mono text-lg font-semibold tabular">{sa} – {sb}</span>
      <span className={`truncate text-right ${winner === b ? "font-semibold" : ""}`}>{b}</span>
    </div>
  );
}
