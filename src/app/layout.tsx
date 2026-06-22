import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/contexts/PlayerContext";
import SiteBackground from "@/components/SiteBackground";
import PlayerDock from "@/components/player/PlayerDock";
import Nav from "@/components/Nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jbMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Rob Cazin — Composer, Visual Artist, Musician & Sound Designer",
    template: "%s · Rob Cazin",
  },
  description:
    "Portfolio site for Rob Cazin — composer, sound designer, guitarist, and visual artist. Original scores, sound design, improvisation, and generative work.",
  metadataBase: new URL("https://robcazin.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jbMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <SiteBackground />
        <div className="site-shell">
          <PlayerProvider>
            <Nav />
            <main id="main-content">{children}</main>
            <PlayerDock />
          </PlayerProvider>
        </div>
      </body>
    </html>
  );
}
