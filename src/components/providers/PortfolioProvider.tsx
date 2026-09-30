"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  BackgroundImage,
  ComingSoonConfig,
  ContactConfig,
  Education,
  Experience,
  FeatureVideo,
  HeroGlassConfig,
  Language,
  Locale,
  MainShowreel,
  NavConfig,
  PortfolioData,
  Profile,
  Project,
  QuotesConfig,
  SectionLabelsConfig,
  Skill,
  SocialConfig,
  SocialPost,
  UiPrefs,
} from "@/lib/types";
import { DATA_VERSION, DEFAULT_COMING_SOON, DEFAULT_NAV } from "@/lib/types";
import { DEFAULT_BACKGROUND, DEFAULT_PORTFOLIO } from "@/lib/defaults";
import {
  loadPortfolio,
  normalizeBackgroundImages,
  normalizeComingSoon,
  normalizeNav,
  savePortfolio,
} from "@/lib/storage";
import { createId } from "@/lib/utils";
import { isEditEnvironment } from "@/lib/edit-env";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_STORAGE_KEY,
} from "@/i18n/locales";
import { t as translate } from "@/i18n";
import {
  getL,
  type MaybeLocalized,
} from "@/lib/i18n-content";
import { ensureLanguageLocales } from "@/lib/auto-localize";

type PortfolioContextValue = {
  data: PortfolioData;
  isHydrated: boolean;
  /** True only on local (or NEXT_PUBLIC_ALLOW_EDIT) — never in production deploys */
  editAllowed: boolean;
  /** Active only when editAllowed */
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  /** Public display locale */
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Locale used when filling forms in edit mode */
  editingLocale: Locale;
  setEditingLocale: (locale: Locale) => void;
  /** Translate UI chrome key, e.g. `nav.home` */
  t: (key: string) => string;
  /** Resolve localized content for display (or editingLocale when editMode) */
  l: (value: MaybeLocalized) => string;
  /** Always resolve with editingLocale (forms) */
  le: (value: MaybeLocalized) => string;
  toast: string | null;
  showToast: (msg: string) => void;
  updateProfile: (partial: Partial<Profile>) => void;
  /** @deprecated prefer updateBackgroundImages — keeps single-URL compat */
  updateBackground: (url: string) => void;
  /** Replace the wallpaper pool (order preserved). Syncs backgroundUrl. */
  updateBackgroundImages: (images: BackgroundImage[]) => void;
  /**
   * Atomic appearance save (images + UI prefs) — avoids race when
   * updateBackground + updateUi were called back-to-back.
   */
  updateAppearance: (
    images: BackgroundImage[],
    ui?: Partial<UiPrefs>,
    heroGlass?: HeroGlassConfig
  ) => void;
  updateUi: (partial: Partial<UiPrefs>) => void;
  updateContact: (partial: Partial<ContactConfig>) => void;
  updateQuotes: (partial: Partial<QuotesConfig> | QuotesConfig) => void;
  updateSectionLabels: (partial: Partial<SectionLabelsConfig>) => void;
  updateNav: (partial: Partial<NavConfig> | NavConfig) => void;
  updateComingSoon: (partial: Partial<ComingSoonConfig>) => void;
  updateFeatureVideos: (videos: FeatureVideo[]) => void;
  updateMainShowreel: (showreel: MainShowreel) => void;
  addExperience: (exp: Omit<Experience, "id">) => void;
  updateExperience: (id: string, partial: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addProject: (project: Omit<Project, "id">) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addSkill: (skill: Omit<Skill, "id">) => void;
  updateSkill: (id: string, partial: Partial<Skill>) => void;
  removeSkill: (id: string) => void;
  addEducation: (edu: Omit<Education, "id">) => void;
  updateEducation: (id: string, partial: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addLanguage: (lang: Omit<Language, "id">) => void;
  updateLanguage: (id: string, partial: Partial<Language>) => void;
  removeLanguage: (id: string) => void;
  updateSocial: (partial: Partial<SocialConfig>) => void;
  addSocialPost: (post: Omit<SocialPost, "id">) => void;
  updateSocialPost: (id: string, partial: Partial<SocialPost>) => void;
  removeSocialPost: (id: string) => void;
  reorderSocialPosts: (orderedIds: string[]) => void;
  resetToDefaults: () => void;
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PortfolioData>(DEFAULT_PORTFOLIO);
  const [isHydrated, setIsHydrated] = useState(false);
  const [editAllowed, setEditAllowed] = useState(false);
  const [editModeRaw, setEditModeRaw] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [editingLocale, setEditingLocale] = useState<Locale>(DEFAULT_LOCALE);

  // editMode is always false for public/production visitors
  const editMode = editAllowed && editModeRaw;

  useEffect(() => {
    const loaded = loadPortfolio();
    setData(loaded);
    const allowed = isEditEnvironment();
    setEditAllowed(allowed);
    if (!allowed) setEditModeRaw(false);

    let initial: Locale = DEFAULT_LOCALE;
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) initial = stored;
      else if (isLocale(loaded.ui?.locale)) initial = loaded.ui.locale;
    } catch {
      if (isLocale(loaded.ui?.locale)) initial = loaded.ui.locale;
    }
    setLocaleState(initial);
    setEditingLocale(initial);
    if (typeof document !== "undefined") {
      document.documentElement.lang = initial;
    }
    setIsHydrated(true);

    // Backfill FR/EN/PL/ES for language names & levels (custom levels included)
    void ensureLanguageLocales(loaded.languages).then((updates) => {
      if (!updates) return;
      setData((prev) => {
        const languages = prev.languages.map((lang) => {
          const u = updates.find((x) => x.id === lang.id);
          if (!u) return lang;
          return { ...lang, name: u.name, level: u.level };
        });
        const next = { ...prev, languages, version: DATA_VERSION };
        try {
          savePortfolio(next);
        } catch {
          /* ignore */
        }
        return next;
      });
    });
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      if (typeof document !== "undefined") {
        document.documentElement.lang = next;
      }
      // Persist inside portfolio blob too
      setData((prev) => {
        const withUi = {
          ...prev,
          ui: { ...prev.ui, locale: next },
          version: DATA_VERSION,
        };
        try {
          savePortfolio(withUi);
        } catch {
          /* ignore */
        }
        return withUi;
      });
    },
    []
  );

  const setEditMode = useCallback((v: boolean) => {
    if (!isEditEnvironment()) {
      setEditModeRaw(false);
      return;
    }
    setEditModeRaw(v);
  }, []);

  const t = useCallback(
    (key: string) => translate(key, locale),
    [locale]
  );

  /** Display content: follow editingLocale in edit mode for WYSIWYG */
  const l = useCallback(
    (value: MaybeLocalized) =>
      getL(value, editMode ? editingLocale : locale),
    [editMode, editingLocale, locale]
  );

  const le = useCallback(
    (value: MaybeLocalized) => getL(value, editingLocale),
    [editingLocale]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const persist = useCallback(
    (
      next: PortfolioData | ((prev: PortfolioData) => PortfolioData),
      toastMsg?: string
    ) => {
      setData((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        const withVersion = { ...resolved, version: DATA_VERSION };
        try {
          savePortfolio(withVersion);
          if (toastMsg) showToast(toastMsg);
        } catch {
          showToast("Quota de stockage dépassé — image trop lourde ?");
        }
        return withVersion;
      });
    },
    [showToast]
  );

  const updateProfile = useCallback(
    (partial: Partial<Profile>) => {
      persist(
        (prev) => ({
          ...prev,
          profile: { ...prev.profile, ...partial },
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const updateBackground = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;
      persist((prev) => {
        const images = normalizeBackgroundImages(
          prev.backgroundImages,
          prev.backgroundUrl
        );
        // Replace pool with this single URL if empty, else update fallback + ensure present
        const hasUrl = images.some((img) => img.url === trimmed);
        const nextImages = hasUrl
          ? images
          : [...images, { id: createId(), url: trimmed }];
        return {
          ...prev,
          backgroundUrl: trimmed,
          backgroundImages: nextImages,
        };
      }, "Fond mis à jour");
    },
    [persist]
  );

  const updateBackgroundImages = useCallback(
    (images: BackgroundImage[]) => {
      persist((prev) => {
        const list = normalizeBackgroundImages(
          images,
          prev.backgroundUrl || DEFAULT_BACKGROUND
        );
        return {
          ...prev,
          backgroundImages: list,
          backgroundUrl: list[0]?.url || DEFAULT_BACKGROUND,
        };
      }, "Fonds d’écran mis à jour");
    },
    [persist]
  );

  const updateAppearance = useCallback(
    (
      images: BackgroundImage[],
      ui?: Partial<UiPrefs>,
      heroGlass?: HeroGlassConfig
    ) => {
      persist((prev) => {
        const list = normalizeBackgroundImages(
          images,
          prev.backgroundUrl || DEFAULT_BACKGROUND
        );
        return {
          ...prev,
          backgroundImages: list,
          backgroundUrl: list[0]?.url || DEFAULT_BACKGROUND,
          ui: ui ? { ...prev.ui, ...ui } : prev.ui,
          heroGlass: heroGlass ?? prev.heroGlass,
        };
      }, "Apparence enregistrée");
    },
    [persist]
  );

  const updateUi = useCallback(
    (partial: Partial<UiPrefs>) => {
      persist((prev) => ({
        ...prev,
        ui: { ...prev.ui, ...partial },
      }));
    },
    [persist]
  );

  const updateContact = useCallback(
    (partial: Partial<ContactConfig>) => {
      // Always functional — sequential updates (e.g. profile + contact) must not clobber each other
      persist(
        (prev) => ({
          ...prev,
          contact: { ...prev.contact, ...partial },
        }),
        "Contact mis à jour"
      );
    },
    [persist]
  );

  const updateQuotes = useCallback(
    (partial: Partial<QuotesConfig> | QuotesConfig) => {
      persist((prev) => {
        const current = prev.quotes;
        const nextServices =
          "services" in partial && Array.isArray(partial.services)
            ? partial.services
            : current.services;
        return {
          ...prev,
          quotes: {
            ...current,
            ...partial,
            services: nextServices,
          },
        };
      }, "Devis mis à jour");
    },
    [persist]
  );

  const updateSectionLabels = useCallback(
    (partial: Partial<SectionLabelsConfig>) => {
      persist(
        (prev) => ({
          ...prev,
          sectionLabels: {
            ...(prev.sectionLabels ?? DEFAULT_PORTFOLIO.sectionLabels),
            ...partial,
          },
        }),
        "Titres de section mis à jour"
      );
    },
    [persist]
  );

  const updateNav = useCallback(
    (partial: Partial<NavConfig> | NavConfig) => {
      persist(
        (prev) => {
          const current = normalizeNav(prev.nav ?? DEFAULT_NAV);
          const merged = { ...current };
          for (const id of Object.keys(partial) as (keyof NavConfig)[]) {
            const p = partial[id];
            if (!p) continue;
            merged[id] = {
              label:
                p.label != null
                  ? (p.label as typeof current[typeof id]["label"])
                  : current[id].label,
              visible:
                typeof p.visible === "boolean"
                  ? p.visible
                  : current[id].visible,
            };
          }
          return { ...prev, nav: normalizeNav(merged) };
        },
        "Navigation mise à jour"
      );
    },
    [persist]
  );

  const updateComingSoon = useCallback(
    (partial: Partial<ComingSoonConfig>) => {
      persist(
        (prev) => ({
          ...prev,
          comingSoon: normalizeComingSoon({
            ...(prev.comingSoon ?? DEFAULT_COMING_SOON),
            ...partial,
          }),
        }),
        partial.enabled === true
          ? "Coming Soon activé (vue publique)"
          : partial.enabled === false
            ? "Coming Soon désactivé"
            : "Coming Soon mis à jour"
      );
    },
    [persist]
  );

  const updateFeatureVideos = useCallback(
    (videos: FeatureVideo[]) => {
      persist(
        (prev) => ({ ...prev, featureVideos: videos }),
        "Vidéos mises à jour"
      );
    },
    [persist]
  );

  const updateMainShowreel = useCallback(
    (showreel: MainShowreel) => {
      // Keep profile.showreelUrl in sync for contact/hero when YouTube
      persist((prev) => {
        const nextProfile =
          showreel.videoType === "youtube" && showreel.videoUrl
            ? { ...prev.profile, showreelUrl: showreel.videoUrl }
            : prev.profile;
        return {
          ...prev,
          mainShowreel: showreel,
          profile: nextProfile,
        };
      }, "Showreel mis à jour");
    },
    [persist]
  );

  const addExperience = useCallback(
    (exp: Omit<Experience, "id">) => {
      persist(
        (prev) => ({
          ...prev,
          experiences: [{ ...exp, id: createId() }, ...prev.experiences],
        }),
        "Expérience ajoutée"
      );
    },
    [persist]
  );

  const updateExperience = useCallback(
    (id: string, partial: Partial<Experience>) => {
      persist(
        (prev) => ({
          ...prev,
          experiences: prev.experiences.map((e) =>
            e.id === id ? { ...e, ...partial } : e
          ),
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const removeExperience = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          experiences: prev.experiences.filter((e) => e.id !== id),
        }),
        "Supprimé"
      );
    },
    [persist]
  );

  const addProject = useCallback(
    (project: Omit<Project, "id">) => {
      persist(
        (prev) => ({
          ...prev,
          projects: [{ ...project, id: createId() }, ...prev.projects],
        }),
        "Projet ajouté"
      );
    },
    [persist]
  );

  const updateProject = useCallback(
    (id: string, partial: Partial<Project>) => {
      persist(
        (prev) => ({
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === id ? { ...p, ...partial } : p
          ),
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const removeProject = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== id),
        }),
        "Supprimé"
      );
    },
    [persist]
  );

  const addSkill = useCallback(
    (skill: Omit<Skill, "id">) => {
      persist(
        (prev) => ({
          ...prev,
          skills: [...prev.skills, { ...skill, id: createId() }],
        }),
        "Compétence ajoutée"
      );
    },
    [persist]
  );

  const updateSkill = useCallback(
    (id: string, partial: Partial<Skill>) => {
      persist(
        (prev) => ({
          ...prev,
          skills: prev.skills.map((s) =>
            s.id === id ? { ...s, ...partial } : s
          ),
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const removeSkill = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s.id !== id),
        }),
        "Supprimé"
      );
    },
    [persist]
  );

  const addEducation = useCallback(
    (edu: Omit<Education, "id">) => {
      persist(
        (prev) => ({
          ...prev,
          education: [{ ...edu, id: createId() }, ...prev.education],
        }),
        "Formation ajoutée"
      );
    },
    [persist]
  );

  const updateEducation = useCallback(
    (id: string, partial: Partial<Education>) => {
      persist(
        (prev) => ({
          ...prev,
          education: prev.education.map((e) =>
            e.id === id ? { ...e, ...partial } : e
          ),
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const removeEducation = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          education: prev.education.filter((e) => e.id !== id),
        }),
        "Supprimé"
      );
    },
    [persist]
  );

  const addLanguage = useCallback(
    (lang: Omit<Language, "id">) => {
      persist(
        (prev) => ({
          ...prev,
          languages: [...prev.languages, { ...lang, id: createId() }],
        }),
        "Langue ajoutée"
      );
    },
    [persist]
  );

  const updateLanguage = useCallback(
    (id: string, partial: Partial<Language>) => {
      persist(
        (prev) => ({
          ...prev,
          languages: prev.languages.map((l) =>
            l.id === id ? { ...l, ...partial } : l
          ),
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const removeLanguage = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          languages: prev.languages.filter((l) => l.id !== id),
        }),
        "Supprimé"
      );
    },
    [persist]
  );

  const updateSocial = useCallback(
    (partial: Partial<SocialConfig>) => {
      persist(
        (prev) => ({
          ...prev,
          social: {
            ...(prev.social ?? DEFAULT_PORTFOLIO.social),
            ...partial,
          },
        }),
        "Médias mis à jour"
      );
    },
    [persist]
  );

  const addSocialPost = useCallback(
    (post: Omit<SocialPost, "id">) => {
      persist((prev) => {
        const current = prev.socialPosts ?? [];
        const minOrder = current.reduce(
          (min, p) => Math.min(min, p.order),
          0
        );
        return {
          ...prev,
          socialPosts: [
            { ...post, id: createId(), order: minOrder - 1 },
            ...current,
          ],
        };
      }, "Post ajouté");
    },
    [persist]
  );

  const updateSocialPost = useCallback(
    (id: string, partial: Partial<SocialPost>) => {
      persist(
        (prev) => ({
          ...prev,
          socialPosts: (prev.socialPosts ?? []).map((p) =>
            p.id === id ? { ...p, ...partial } : p
          ),
        }),
        "Enregistré"
      );
    },
    [persist]
  );

  const removeSocialPost = useCallback(
    (id: string) => {
      persist(
        (prev) => ({
          ...prev,
          socialPosts: (prev.socialPosts ?? []).filter((p) => p.id !== id),
        }),
        "Post supprimé"
      );
    },
    [persist]
  );

  const reorderSocialPosts = useCallback(
    (orderedIds: string[]) => {
      persist((prev) => {
        const byId = new Map((prev.socialPosts ?? []).map((p) => [p.id, p]));
        const next: SocialPost[] = [];
        orderedIds.forEach((id, i) => {
          const post = byId.get(id);
          if (post) {
            next.push({ ...post, order: i });
            byId.delete(id);
          }
        });
        // Keep any leftover posts at the end
        for (const leftover of byId.values()) {
          next.push({ ...leftover, order: next.length });
        }
        return { ...prev, socialPosts: next };
      });
    },
    [persist]
  );

  const resetToDefaults = useCallback(() => {
    persist(structuredClone(DEFAULT_PORTFOLIO), "Données réinitialisées");
  }, [persist]);

  const value = useMemo(
    () => ({
      data,
      isHydrated,
      editAllowed,
      editMode,
      setEditMode,
      locale,
      setLocale,
      editingLocale,
      setEditingLocale,
      t,
      l,
      le,
      toast,
      showToast,
      updateProfile,
      updateBackground,
      updateBackgroundImages,
      updateAppearance,
      updateUi,
      updateContact,
      updateQuotes,
      updateSectionLabels,
      updateNav,
      updateComingSoon,
      updateFeatureVideos,
      updateMainShowreel,
      addExperience,
      updateExperience,
      removeExperience,
      addProject,
      updateProject,
      removeProject,
      addSkill,
      updateSkill,
      removeSkill,
      addEducation,
      updateEducation,
      removeEducation,
      addLanguage,
      updateLanguage,
      removeLanguage,
      updateSocial,
      addSocialPost,
      updateSocialPost,
      removeSocialPost,
      reorderSocialPosts,
      resetToDefaults,
    }),
    [
      data,
      isHydrated,
      editAllowed,
      editMode,
      setEditMode,
      locale,
      setLocale,
      editingLocale,
      t,
      l,
      le,
      toast,
      showToast,
      updateProfile,
      updateBackground,
      updateBackgroundImages,
      updateAppearance,
      updateUi,
      updateContact,
      updateQuotes,
      updateSectionLabels,
      updateNav,
      updateComingSoon,
      updateFeatureVideos,
      updateMainShowreel,
      addExperience,
      updateExperience,
      removeExperience,
      addProject,
      updateProject,
      removeProject,
      addSkill,
      updateSkill,
      removeSkill,
      addEducation,
      updateEducation,
      removeEducation,
      addLanguage,
      updateLanguage,
      removeLanguage,
      updateSocial,
      addSocialPost,
      updateSocialPost,
      removeSocialPost,
      reorderSocialPosts,
      resetToDefaults,
    ]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className="no-print fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm text-zinc-100 shadow-xl backdrop-blur-xl"
        >
          {toast}
        </div>
      )}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error("usePortfolio must be used within PortfolioProvider");
  }
  return ctx;
}
