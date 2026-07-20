"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  Eye,
  FileDown,
  ImageIcon,
  Menu,
  Pencil,
  X,
} from "lucide-react";
import { cn, printCv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { WallpaperEditor } from "@/components/background/WallpaperEditor";
import { EditGate } from "@/components/shared/EditGate";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { EditLocaleBar } from "@/components/i18n/EditLocaleBar";

const LINK_DEFS = [
  { href: "/#hero", key: "nav.home", id: "hero" },
  { href: "/#experience", key: "nav.experience", id: "experience" },
  { href: "/#projects", key: "nav.projects", id: "projects" },
  { href: "/#skills", key: "nav.skills", id: "skills" },
  { href: "/#education", key: "nav.education", id: "education" },
  { href: "/#contact", key: "nav.contact", id: "contact" },
] as const;

export function Header() {
  const { editMode, setEditMode, editAllowed, t } = usePortfolio();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("hero");
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const ids = LINK_DEFS.map((l) => l.id);
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  return (
    <header
      className={cn(
        "no-print fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled || editMode
          ? "border-b border-white/12 bg-black/40 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/30"
          : "bg-transparent"
      )}
    >
      {editMode && (
        <div className="border-b border-teal-300/20 bg-teal-300/15 px-4 py-1.5 text-center text-xs font-medium text-teal-100 backdrop-blur-md">
          {t("edit.modeOn")}
        </div>
      )}
      <EditLocaleBar />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/#hero"
          className="flex items-center gap-2 font-semibold tracking-tight text-zinc-50"
        >
          <span className="glass-chip flex h-9 w-9 items-center justify-center rounded-2xl text-teal-300 shadow-lg">
            <Clapperboard className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Patrick Roziel</span>
          <span className="sm:hidden">PR</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {LINK_DEFS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-xl px-2.5 py-2 text-sm transition-colors",
                active === link.id && pathname === "/"
                  ? "bg-white/10 text-teal-200"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              {t(link.key)}
            </a>
          ))}
          <Link
            href="/projets"
            className={cn(
              "rounded-xl px-2.5 py-2 text-sm transition-colors",
              pathname?.startsWith("/projets")
                ? "bg-white/10 text-teal-200"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            )}
          >
            {t("nav.gallery")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher compact />
          <EditGate>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setAppearanceOpen(true)}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {t("actions.appearance")}
            </Button>
          </EditGate>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => printCv()}
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </Button>
          {editAllowed && (
            <Button
              variant={editMode ? "default" : "secondary"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="gap-1.5"
            >
              {editMode ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("actions.quit")}</span>
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("actions.edit")}</span>
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/12 bg-black/55 px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/40 lg:hidden">
          <div className="mb-2 flex justify-end">
            <LanguageSwitcher />
          </div>
          <nav className="flex flex-col gap-1">
            {LINK_DEFS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10"
              >
                {t(link.key)}
              </a>
            ))}
            <Link
              href="/projets"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10"
            >
              {t("nav.gallery")}
            </Link>
            <EditGate>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setOpen(false);
                  setAppearanceOpen(true);
                }}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Apparence
              </Button>
            </EditGate>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 sm:hidden"
              onClick={() => {
                setOpen(false);
                printCv();
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              Exporter PDF
            </Button>
          </nav>
        </div>
      )}

      <WallpaperEditor open={appearanceOpen} onOpenChange={setAppearanceOpen} />
    </header>
  );
}
