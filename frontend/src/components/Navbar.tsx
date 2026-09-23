"use client";

import Link from "next/link";
import { Trophy, Calendar, Swords, GitFork, Users } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-400 transition">
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
            EventForge
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800/60 text-purple-400 font-mono">
              Tournaments
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-semibold transition glow-purple"
          >
            <Calendar className="w-3.5 h-3.5" />
            Tournaments
          </Link>
        </div>
      </div>
    </nav>
  );
}
