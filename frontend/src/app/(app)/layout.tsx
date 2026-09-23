import { EventShell } from "@/components/event-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <EventShell>{children}</EventShell>;
}
