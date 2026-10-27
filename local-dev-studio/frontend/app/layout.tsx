import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@xterm/xterm/css/xterm.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeForge — Pure Local Vibe-Coding Engine",
  description:
    "Pure local vibe-coding engine that synthesizes full-stack apps, runs terminal commands in isolated sandboxes, and live-previews results.",
  icons: {
    icon: "/vibeforge-icon.svg",
    shortcut: "/vibeforge-icon.svg",
    apple: "/vibeforge-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="antialiased bg-slate-950 text-slate-100 h-screen w-screen overflow-hidden"
      >
        {children}
      </body>
    </html>
  );
}
