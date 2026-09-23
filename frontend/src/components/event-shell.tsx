"use client";

import { Trophy } from "lucide-react";
import { Logo } from "@/components/brand";
import { AppShell, ShellAccount, type NavItem } from "@/components/kit/shell";
import { DEMO_GUILD_NAME } from "@/lib/api";

const NAV: NavItem[] = [{ href: "/dashboard", label: "Tournaments", icon: Trophy }];

export function EventShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell brand={<Logo />} items={NAV}
      footer={<ShellAccount name="Tournament staff" detail={DEMO_GUILD_NAME} note="Demo server — players and results are generated; no Discord account is connected." />}>
      {children}
    </AppShell>
  );
}
