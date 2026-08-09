"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { GlassCard } from "@/components/glass/GlassCard";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { RichHtml } from "@/components/shared/RichHtml";
import {
  DEFAULT_QUOTES,
  QUOTE_SERVICE_IDS,
  type QuoteServiceId,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function isQuoteId(v: string): v is QuoteServiceId {
  return (QUOTE_SERVICE_IDS as string[]).includes(v);
}

export default function DevisPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data, editMode, l, t, isHydrated } = usePortfolio();
  const quotes = data.quotes ?? DEFAULT_QUOTES;

  const service =
    isQuoteId(slug) && quotes.services.find((s) => s.id === slug);

  if (!isHydrated) {
    return (
      <main className="no-print relative z-10 pb-20 pt-28 sm:pt-32">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (!service || (!service.show && !editMode)) {
    return (
      <main className="no-print relative z-10 pb-20 pt-28 sm:pt-32">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <Link
            href="/#devis"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-teal-300"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("quotes.backToQuotes")}
          </Link>
          <GlassCard className="p-8 text-center">
            <p className="text-lg font-medium text-zinc-100">
              {t("quotes.notFoundTitle")}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {t("quotes.notFoundDesc")}
            </p>
            <Link
              href="/#devis"
              className="mt-6 inline-flex text-sm text-teal-300 hover:underline"
            >
              {t("quotes.backToQuotes")}
            </Link>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="no-print relative z-10 pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/#devis"
          className={cn(
            "mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-teal-300"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("quotes.backToQuotes")}
        </Link>

        <GlassCard elevated className="overflow-hidden p-6 sm:p-10">
          {!service.show && editMode && (
            <p className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              {t("quotes.hiddenPreview")}
            </p>
          )}

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/90">
            {t("quotes.pageEyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {l(service.pageTitle)}
          </h1>
          <RichHtml
            html={l(service.pageIntro)}
            className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base"
          />

          <div className="my-8 h-px bg-white/10" />

          <QuoteForm
            serviceId={service.id}
            serviceTitle={l(service.pageTitle)}
          />
        </GlassCard>

        <p className="mt-6 text-center text-xs text-zinc-500">
          {t("quotes.privacyNote")}
        </p>
      </div>
    </main>
  );
}
