import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PortfolioProvider } from "@/components/providers/PortfolioProvider";
import { SkillDetailProvider } from "@/components/skills/SkillDetailProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patrick Roziel — Monteur vidéo & Motion designer",
  description:
    "Portfolio de Patrick Roziel, monteur vidéo, motion designer et chargé de communication digitale à La Courneuve (93). Showreel, expériences et compétences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}
      >
        <PortfolioProvider>
          <SkillDetailProvider>
            <SiteChrome>{children}</SiteChrome>
          </SkillDetailProvider>
        </PortfolioProvider>
      </body>
    </html>
  );
}
