import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { PortfolioProvider } from "@/components/providers/PortfolioProvider";
import { SkillDetailProvider } from "@/components/skills/SkillDetailProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "./globals.css";

const workSans = Manrope({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patrick Roziel — Work & Notes",
  description:
    "Work et Notes de Patrick Roziel : portfolio professionnel, expériences, compétences, réflexions, documents, images et vidéos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${workSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}
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
