import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { PortfolioProvider } from "@/components/providers/PortfolioProvider";
import { SkillDetailProvider } from "@/components/skills/SkillDetailProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL(NOTES_ORIGIN),
  title: {
    default: "Patrick Roziel — Monteur vidéo, Notes et Air",
    template: "%s",
  },
  description:
    "Patrick Roziel, monteur vidéo et créateur de contenus à La Courneuve. Notes, décryptages Air, et portfolio Work : motion design, expériences et showreel.",
  applicationName: "Patrick Roziel",
  authors: [{ name: "Patrick Roziel", url: NOTES_ORIGIN }],
  creator: "Patrick Roziel",
  category: "portfolio",
  verification: {
    google: "NLj8M7f3PPPdLcBNph-KpFeT-0d1wKJY93jyC7BTHoM",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Patrick Roziel",
    url: NOTES_ORIGIN,
  },
  twitter: {
    card: "summary_large_image",
    creator: "@patwithnoE",
  },
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
        <SiteJsonLd />
        <PortfolioProvider>
          <SkillDetailProvider>
            <SiteChrome>{children}</SiteChrome>
          </SkillDetailProvider>
        </PortfolioProvider>
        <Analytics />
      </body>
    </html>
  );
}
