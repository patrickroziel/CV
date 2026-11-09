import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { PortfolioProvider } from "@/components/providers/PortfolioProvider";
import { SkillDetailProvider } from "@/components/skills/SkillDetailProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./article-typography.css";

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
    default: "Patrick Roziel — Monteur vidéo, Motion Design & Notes",
    template: "%s",
  },
  description:
    "Patrick Roziel, monteur vidéo et motion designer à La Courneuve (93). Notes, décryptages Air, portfolio Work et projets : montage, motion design, showreel.",
  keywords: ["monteur vidéo", "motion design", "montage vidéo", "Patrick Roziel", "La Courneuve", "portfolio", "contenus digitaux"],
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Patrick Roziel — Notes, Air et Work",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@patwithnoE",
    images: ["/twitter-image"],
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
