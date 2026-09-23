import Link from "next/link";
import { Trophy, Swords, Calendar, ArrowRight, ShieldCheck, CheckCircle2, GitBranch, Zap, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Competitive Discord Tournaments • Deterministic Bracket Algorithm</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Tournament brackets & events, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400">
            automated for Discord.
          </span>
        </h1>

        <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Manage full competition lifecycles from registration check-ins to mathematical bye allocation, dual-confirmation score reporting, and live interactive bracket trees.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 transition glow-purple"
          >
            Explore Active Tournaments
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">Mathematical Byes Algorithm</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Gracefully accommodates non-power-of-two participant pools (e.g. 6 or 13 players) by auto-allocating byes to top seeds without unplayed bracket deadlocks.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">Dual-Confirmation Results</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Player A submits a 2–1 match score, and Player B must confirm before winner advancement triggers. Disputed scores route to staff with full audit trails.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white">Live Visual Bracket</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Responsive horizontal bracket tree rendering real-time match statuses, participant scores, and champion paths across all competition stages.
          </p>
        </div>
      </section>
    </div>
  );
}
