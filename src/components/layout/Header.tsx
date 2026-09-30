"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  Eye,
  FileDown,
  ImageIcon,
  Menu,
  Pencil,
  PanelTop,
  Radio,
  Rocket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { WallpaperEditor } from "@/components/background/WallpaperEditor";
import { EditGate } from "@/components/shared/EditGate";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { EditLocaleBar } from "@/components/i18n/EditLocaleBar";
import { NavSettingsPanel } from "@/components/layout/NavSettingsPanel";
import { ComingSoonSettingsPanel } from "@/components/coming-soon/ComingSoonSettingsPanel";
import {
  UniverseSwitch,
  useUniverse,
} from "@/components/layout/UniverseSwitch";
import { downloadPortfolioSnapshot } from "@/lib/storage";
import {
  DEFAULT_COMING_SOON,
  DEFAULT_NAV,
  NAV_ITEM_META,
  type NavItemId,
} from "@/lib/types";
import { getL } from "@/lib/i18n-content";

export function Header() {
  const {
    editMode,
    setEditMode,
    editAllowed,
    t,
    l,
    data,
    showToast,
    updateComingSoon,
  } = usePortfolio();
  const pathname = usePathname();
  const universe = useUniverse();
  const isMedias = universe === "medias";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("hero");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [navFocus, setNavFocus] = useState<NavItemId | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const nav = data.nav ?? DEFAULT_NAV;
  const comingSoonOn = Boolean(
    (data.comingSoon ?? DEFAULT_COMING_SOON).enabled
  );

  const visibleLinks = useMemo(
    () =>
      NAV_ITEM_META.filter((meta) => {
        // Sections like Devis can be toggled but stay out of the top menu
        if (meta.showInNav === false) return false;
        const cfg = nav[meta.id] ?? DEFAULT_NAV[meta.id];
        return cfg?.visible !== false;
      }).map((meta) => {
        const cfg = nav[meta.id] ?? DEFAULT_NAV[meta.id];
        const custom = getL(cfg.label).trim();
        const label = custom || t(meta.i18nKey);
        return { ...meta, label };
      }),
    [nav, t]
  );

  // Prefer portfolio display locale via l() for custom labels when available
  const resolveLabel = (id: NavItemId, fallbackKey: string) => {
    const cfg = nav[id] ?? DEFAULT_NAV[id];
    const fromData = l(cfg.label).trim();
    return fromData || t(fallbackKey);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const ids = NAV_ITEM_META.map((m) => m.sectionId).filter(
      (id): id is string => Boolean(id)
    );
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

  const openNavEditor = (id?: NavItemId) => {
    setNavFocus(id ?? null);
    setNavOpen(true);
  };

  return (
    <header
      className={cn(
        "no-print fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled || editMode
          ? cn(
              "border-b bg-black/40 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/30",
              isMedias ? "border-violet-300/20" : "border-white/12"
            )
          : "bg-transparent"
      )}
    >
      {editMode && (
        <div
          className={cn(
            "border-b px-4 py-1.5 text-center text-xs font-medium backdrop-blur-md",
            isMedias
              ? "border-violet-300/20 bg-violet-400/15 text-violet-100"
              : "border-teal-300/20 bg-teal-300/15 text-teal-100"
          )}
        >
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            {t("edit.modeOn")}
            <span className="text-teal-200/50">·</span>
            <button
              type="button"
              onClick={() =>
                updateComingSoon({ enabled: !comingSoonOn })
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition",
                comingSoonOn
                  ? "border-amber-300/40 bg-amber-400/20 text-amber-50"
                  : "border-white/20 bg-black/20 text-teal-50 hover:bg-black/30"
              )}
              title="Active la page publique Coming Soon (le Mode Édition reste complet)"
            >
              <Rocket className="h-3 w-3" />
              Coming Soon : {comingSoonOn ? "ON" : "OFF"}
            </button>
          </span>
        </div>
      )}
      <EditLocaleBar />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={isMedias ? "/medias" : "/#hero"}
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-50"
          >
            <span
              className={cn(
                "glass-chip flex h-9 w-9 items-center justify-center rounded-2xl shadow-lg",
                isMedias ? "text-violet-300" : "text-teal-300"
              )}
            >
              {isMedias ? (
                <Radio className="h-4 w-4" />
              ) : (
                <Clapperboard className="h-4 w-4" />
              )}
            </span>
            <span className="hidden sm:inline">Patrick Roziel</span>
          </Link>
          <UniverseSwitch />
        </div>

        <nav
          className={cn(
            "hidden items-center gap-0.5 lg:flex",
            isMedias && "lg:hidden"
          )}
        >
          {visibleLinks.map((link) => {
            const isGallery = link.id === "gallery";
            const isActive = isGallery
              ? pathname?.startsWith("/projets")
              : active === link.sectionId && pathname === "/";
            const label = resolveLabel(link.id, link.i18nKey);

            if (editMode) {
              return (
                <button
                  key={link.id}
                  type="button"
                  title="Modifier le libellé"
                  onClick={() => openNavEditor(link.id)}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-white/10 text-teal-200"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  )}
                >
                  {label}
                </button>
              );
            }

            if (isGallery) {
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-white/10 text-teal-200"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  )}
                >
                  {label}
                </Link>
              );
            }

            return (
              <a
                key={link.id}
                href={link.href}
                className={cn(
                  "rounded-xl px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-white/10 text-teal-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                )}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher compact />
          <EditGate>
            <Button
              variant={comingSoonOn ? "default" : "ghost"}
              size="sm"
              className={cn(
                "hidden sm:inline-flex",
                comingSoonOn && "bg-amber-400/90 text-zinc-950 hover:bg-amber-300"
              )}
              onClick={() => setComingSoonOpen(true)}
              title="Coming Soon — page publique (showreel + features)"
            >
              <Rocket className="h-3.5 w-3.5" />
              Coming Soon
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => openNavEditor()}
              title="Éditer les libellés du menu"
            >
              <PanelTop className="h-3.5 w-3.5" />
              Menu
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setAppearanceOpen(true)}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {t("actions.appearance")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              title="Exporter le JSON pour defaults production"
              onClick={() => {
                downloadPortfolioSnapshot(data);
                showToast("Snapshot JSON téléchargé");
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              Export JSON
            </Button>
          </EditGate>
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
            {isMedias ? (
              <p className="px-3 py-2 text-xs text-violet-200/80">
                {t("medias.mediasHint")}
              </p>
            ) : (
              visibleLinks.map((link) => {
              const label = resolveLabel(link.id, link.i18nKey);
              if (editMode) {
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openNavEditor(link.id);
                    }}
                    className="rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/10"
                  >
                    {label}
                  </button>
                );
              }
              if (link.id === "gallery") {
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10"
                  >
                    {label}
                  </Link>
                );
              }
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/10"
                >
                  {label}
                </a>
              );
            })
            )}
            <EditGate>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setOpen(false);
                  setComingSoonOpen(true);
                }}
              >
                <Rocket className="h-3.5 w-3.5" />
                Coming Soon
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setOpen(false);
                  openNavEditor();
                }}
              >
                <PanelTop className="h-3.5 w-3.5" />
                Éditer le menu
              </Button>
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
          </nav>
        </div>
      )}

      <WallpaperEditor open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <NavSettingsPanel
        open={navOpen}
        onOpenChange={setNavOpen}
        focusId={navFocus}
      />
      <ComingSoonSettingsPanel
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
      />
    </header>
  );
}
