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
  ContactConfig,
  Education,
  Experience,
  FeatureVideo,
  Language,
  Locale,
  MainShowreel,
  PortfolioData,
  Profile,
  Project,
  SectionLabelsConfig,
  Skill,
  UiPrefs,
} from "@/lib/types";
import { DATA_VERSION } from "@/lib/types";
import { DEFAULT_PORTFOLIO } from "@/lib/defaults";
import { loadPortfolio, savePortfolio } from "@/lib/storage";
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
  updateBackground: (url: string) => void;
  updateUi: (partial: Partial<UiPrefs>) => void;
  updateContact: (partial: Partial<ContactConfig>) => void;
  updateSectionLabels: (partial: Partial<SectionLabelsConfig>) => void;
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
    (next: PortfolioData, toastMsg?: string) => {
      const withVersion = { ...next, version: DATA_VERSION };
      setData(withVersion);
      try {
        savePortfolio(withVersion);
        if (toastMsg) showToast(toastMsg);
      } catch {
        showToast("Quota de stockage dépassé — image trop lourde ?");
      }
    },
    [showToast]
  );

  const updateProfile = useCallback(
    (partial: Partial<Profile>) => {
      persist({ ...data, profile: { ...data.profile, ...partial } }, "Enregistré");
    },
    [data, persist]
  );

  const updateBackground = useCallback(
    (url: string) => {
      persist({ ...data, backgroundUrl: url }, "Fond mis à jour");
    },
    [data, persist]
  );

  const updateUi = useCallback(
    (partial: Partial<UiPrefs>) => {
      persist({ ...data, ui: { ...data.ui, ...partial } });
    },
    [data, persist]
  );

  const updateContact = useCallback(
    (partial: Partial<ContactConfig>) => {
      persist(
        { ...data, contact: { ...data.contact, ...partial } },
        "Contact mis à jour"
      );
    },
    [data, persist]
  );

  const updateSectionLabels = useCallback(
    (partial: Partial<SectionLabelsConfig>) => {
      const current = data.sectionLabels ?? DEFAULT_PORTFOLIO.sectionLabels;
      persist(
        {
          ...data,
          sectionLabels: { ...current, ...partial },
        },
        "Titres de section mis à jour"
      );
    },
    [data, persist]
  );

  const updateFeatureVideos = useCallback(
    (videos: FeatureVideo[]) => {
      persist({ ...data, featureVideos: videos }, "Vidéos mises à jour");
    },
    [data, persist]
  );

  const updateMainShowreel = useCallback(
    (showreel: MainShowreel) => {
      // Keep profile.showreelUrl in sync for contact/hero when YouTube
      const nextProfile =
        showreel.videoType === "youtube" && showreel.videoUrl
          ? { ...data.profile, showreelUrl: showreel.videoUrl }
          : data.profile;
      persist(
        { ...data, mainShowreel: showreel, profile: nextProfile },
        "Showreel mis à jour"
      );
    },
    [data, persist]
  );

  const addExperience = useCallback(
    (exp: Omit<Experience, "id">) => {
      persist({
        ...data,
        experiences: [{ ...exp, id: createId() }, ...data.experiences],
      }, "Expérience ajoutée");
    },
    [data, persist]
  );

  const updateExperience = useCallback(
    (id: string, partial: Partial<Experience>) => {
      persist({
        ...data,
        experiences: data.experiences.map((e) =>
          e.id === id ? { ...e, ...partial } : e
        ),
      }, "Enregistré");
    },
    [data, persist]
  );

  const removeExperience = useCallback(
    (id: string) => {
      persist({
        ...data,
        experiences: data.experiences.filter((e) => e.id !== id),
      }, "Supprimé");
    },
    [data, persist]
  );

  const addProject = useCallback(
    (project: Omit<Project, "id">) => {
      persist({
        ...data,
        projects: [{ ...project, id: createId() }, ...data.projects],
      }, "Projet ajouté");
    },
    [data, persist]
  );

  const updateProject = useCallback(
    (id: string, partial: Partial<Project>) => {
      persist({
        ...data,
        projects: data.projects.map((p) =>
          p.id === id ? { ...p, ...partial } : p
        ),
      }, "Enregistré");
    },
    [data, persist]
  );

  const removeProject = useCallback(
    (id: string) => {
      persist({
        ...data,
        projects: data.projects.filter((p) => p.id !== id),
      }, "Supprimé");
    },
    [data, persist]
  );

  const addSkill = useCallback(
    (skill: Omit<Skill, "id">) => {
      persist({
        ...data,
        skills: [...data.skills, { ...skill, id: createId() }],
      }, "Compétence ajoutée");
    },
    [data, persist]
  );

  const updateSkill = useCallback(
    (id: string, partial: Partial<Skill>) => {
      persist({
        ...data,
        skills: data.skills.map((s) =>
          s.id === id ? { ...s, ...partial } : s
        ),
      }, "Enregistré");
    },
    [data, persist]
  );

  const removeSkill = useCallback(
    (id: string) => {
      persist({
        ...data,
        skills: data.skills.filter((s) => s.id !== id),
      }, "Supprimé");
    },
    [data, persist]
  );

  const addEducation = useCallback(
    (edu: Omit<Education, "id">) => {
      persist({
        ...data,
        education: [{ ...edu, id: createId() }, ...data.education],
      }, "Formation ajoutée");
    },
    [data, persist]
  );

  const updateEducation = useCallback(
    (id: string, partial: Partial<Education>) => {
      persist({
        ...data,
        education: data.education.map((e) =>
          e.id === id ? { ...e, ...partial } : e
        ),
      }, "Enregistré");
    },
    [data, persist]
  );

  const removeEducation = useCallback(
    (id: string) => {
      persist({
        ...data,
        education: data.education.filter((e) => e.id !== id),
      }, "Supprimé");
    },
    [data, persist]
  );

  const addLanguage = useCallback(
    (lang: Omit<Language, "id">) => {
      persist({
        ...data,
        languages: [...data.languages, { ...lang, id: createId() }],
      }, "Langue ajoutée");
    },
    [data, persist]
  );

  const updateLanguage = useCallback(
    (id: string, partial: Partial<Language>) => {
      persist({
        ...data,
        languages: data.languages.map((l) =>
          l.id === id ? { ...l, ...partial } : l
        ),
      }, "Enregistré");
    },
    [data, persist]
  );

  const removeLanguage = useCallback(
    (id: string) => {
      persist({
        ...data,
        languages: data.languages.filter((l) => l.id !== id),
      }, "Supprimé");
    },
    [data, persist]
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
      updateUi,
      updateContact,
      updateSectionLabels,
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
      updateUi,
      updateContact,
      updateSectionLabels,
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
