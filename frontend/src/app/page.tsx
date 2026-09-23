"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown, Flag, GitFork, ListOrdered, Megaphone, ShieldCheck, Swords, UserPlus, Users } from "lucide-react";
import { Logo } from "@/components/brand";
import { CtaBand, FeatureCard, Hero, HeroButton, HeroCard, InfoCard, Section, SiteFooter, SiteNav } from "@/components/kit/site";
import { Pill } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Mini({ a, b, sa, sb, win, status }: { a: string; b: string; sa?: number; sb?: number; win?: "a" | "b"; status?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card text-sm">
      {[[a, sa, win === "a"], [b, sb, win === "b"]].map(([name, score, won], i) => (
        <div key={i} className={cn("flex justify-between gap-2 px-3 py-1.5", i === 0 && "border-b", won && "bg-ok/10 font-semibold")}>
          <span className="truncate">{name as string}</span>
          {score !== undefined ? <span className="font-mono text-xs tabular">{score as number}</span> : null}
        </div>
      ))}
      {status ? <div className="border-t px-3 py-1 text-[11px] font-medium text-warn">{status}</div> : null}
    </div>
  );
}

function BracketPreview() {
  return (
    <HeroCard>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">Apex Summer Championship</span>
        <Pill tone="run" pulse>Live</Pill>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Quarter-finals</p>
          <Mini a="Valkyrie" b="Quantum" sa={2} sb={0} win="a" />
          <Mini a="FrostByte" b="BlazeRider" sa={2} sb={1} status="Awaiting confirmation" />
        </div>
        <div className="flex flex-col justify-center space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Semi-finals</p>
          <Mini a="Valkyrie" b="TBD" />
        </div>
        <div className="flex flex-col justify-center space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Champion</p>
          <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground"><Crown className="size-4" />To be decided</div>
        </div>
      </div>
    </HeroCard>
  );
}

export default function Landing() {
  return (
    <>
      <SiteNav brand={<Logo />} links={[["#how", "How it works"], ["#features", "Features"], ["#use-cases", "Use cases"]]}
        actions={<Button asChild size="sm"><Link href="/dashboard">Open the demo</Link></Button>} />
      <main id="main">
        <Hero eyebrow="Discord tournaments"
          title="Run the tournament where your players already are."
          description="EventForge takes sign-ups in Discord, seeds a bracket with fair byes or a round-robin league, and lets players report their own scores — the opponent confirms, and disputes go to staff."
          actions={<><HeroButton href="/dashboard">Open the tournaments<ArrowRight data-icon="inline-end" /></HeroButton><HeroButton href="#how" variant="outline">How it works</HeroButton></>}
          note="The demo has a live knockout, a cup taking sign-ups and a finished league."
          visual={<BracketPreview />} />

        <Section id="how" eyebrow="How it works" title="From sign-ups to a champion">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={Megaphone} title="Announce" index={1}>Create a knockout or a league with a size and a start time.</FeatureCard>
            <FeatureCard icon={UserPlus} title="Players sign up" index={2} delay={0.05}>A button in Discord adds them, in order, until the bracket is full.</FeatureCard>
            <FeatureCard icon={GitFork} title="Seed the bracket" index={3} delay={0.1}>Top seeds get the byes; bye winners are already in round two.</FeatureCard>
            <FeatureCard icon={Swords} title="Play and report" index={4} delay={0.15}>One player reports, the other confirms, the winner moves on automatically.</FeatureCard>
          </div>
        </Section>

        <Section id="features" eyebrow="For organisers" title="Less spreadsheet, fewer arguments" tinted>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={GitFork} title="Knockouts of any size">Brackets are padded to the next power of two, so 5 or 13 players work.</FeatureCard>
            <FeatureCard icon={ListOrdered} title="Round-robin leagues" delay={0.05}>Everyone plays everyone; standings rank by wins, then score difference.</FeatureCard>
            <FeatureCard icon={Check} title="Two-step results" delay={0.1}>A score only counts once the opponent confirms it — nobody reports their own win.</FeatureCard>
            <FeatureCard icon={Flag} title="Disputes go to staff">A disputed score stops the match; staff pick the winner and the bracket continues.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Rules the API enforces" delay={0.05}>No sign-ups after the start, no second bracket, no re-reporting finished matches.</FeatureCard>
            <FeatureCard icon={Users} title="Player list" delay={0.1}>Seeds, sign-up times and the champion, all on one page.</FeatureCard>
          </div>
        </Section>

        <Section id="use-cases" eyebrow="Use cases" title="For communities that like to compete" last>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard title="Gaming communities">Weekly 1v1 cups without a moderator filling in a bracket by hand.</InfoCard>
            <InfoCard title="Esports clubs" delay={0.05}>Internal leagues where every result is confirmed by both sides.</InfoCard>
            <InfoCard title="Chess and card clubs">Round robins with standings that update the moment a result is confirmed.</InfoCard>
            <InfoCard title="Community events" delay={0.05}>Charity streams and game nights with a bracket everyone can follow.</InfoCard>
          </div>
          <CtaBand title="Play through a live bracket" description="Confirm a reported score, dispute one, settle it as staff — and watch the winner move on."
            action={<Button asChild size="lg" variant="secondary" className="h-11 px-5"><Link href="/dashboard">Open the demo<ArrowRight data-icon="inline-end" /></Link></Button>} />
        </Section>
      </main>
      <SiteFooter brand={<Logo />} right={<><Check className="size-3.5" />Every result confirmed by the opponent</>} />
    </>
  );
}
