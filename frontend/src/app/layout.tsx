import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "EventForge | Discord Tournament, Event & Match Platform",
  description: "Deterministic single elimination & round robin brackets, automated byes, and verified match results for Discord.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 flex flex-col min-h-screen selection:bg-purple-600 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
