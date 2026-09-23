"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SelectField } from "@/components/kit/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type Format } from "@/lib/api";

function defaultStart(): string {
  const d = new Date(Date.now() + 2 * 86400000);
  d.setMinutes(0, 0, 0);
  d.setHours(18);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

export function NewTournamentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<Format>("single_elimination");
  const [size, setSize] = useState("16");
  const [start, setStart] = useState(defaultStart);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const t = await api.createTournament({ title, description, format, max_participants: Number(size), start_time: new Date(start).toISOString() });
      toast.success("Tournament created — sign-ups are open");
      onOpenChange(false);
      router.push(`/tournaments/${t.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New tournament</DialogTitle>
          <DialogDescription>Sign-ups open straight away; generate the bracket when enough players have joined.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="t-title">Name</Label><Input id="t-title" required minLength={3} maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday Night 1v1" /></div>
          <div className="space-y-1.5"><Label htmlFor="t-desc">Description</Label><Textarea id="t-desc" required minLength={5} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rules, map pool, best-of…" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="t-format">Format</Label><SelectField id="t-format" label="Format" value={format} onChange={(v) => setFormat(v as Format)} options={[{ value: "single_elimination", label: "Single elimination" }, { value: "round_robin", label: "Round robin" }]} /></div>
            <div className="space-y-1.5"><Label htmlFor="t-size">Players</Label><SelectField id="t-size" label="Players" value={size} onChange={setSize} options={["4", "8", "16", "32", "64"]} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="t-start">Starts</Label><Input id="t-start" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create tournament"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
