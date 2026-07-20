import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PortfolioProvider } from "@/components/providers/PortfolioProvider";
import { SkillDetailProvider } from "@/components/skills/SkillDetailProvider";
import { Wallpaper } from "@/components/background/Wallpaper";
import { AmbientOrbs } from "@/components/background/AmbientOrbs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DockNav } from "@/components/layout/DockNav";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { WidgetStack } from "@/components/widgets/WidgetStack";
import { CvPrintView } from "@/components/print/CvPrintView";
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
            <Wallpaper />
            <AmbientOrbs />
            <ScrollProgress />
            <Header />
            <WidgetStack />
            <div className="relative z-10">{children}</div>
            <Footer />
            <DockNav />
            <CvPrintView />
          </SkillDetailProvider>
        </PortfolioProvider>
      </body>
    </html>
  );
}
