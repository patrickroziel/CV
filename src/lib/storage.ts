import type {
  ContactConfig,
  Education,
  Experience,
  FeatureVideo,
  FeatureVideoType,
  Language,
  LanguageVideoType,
  MainShowreel,
  MediaItem,
  PortfolioData,
  Project,
  ProjectMediaType,
  QuickContactIcon,
  QuickContactLink,
  Skill,
  SkillIcon,
} from "./types";
import {
  DATA_VERSION,
  DEFAULT_CONTACT,
  DEFAULT_FEATURE_VIDEOS,
  DEFAULT_MAIN_SHOWREEL,
  DEFAULT_QUICK_CONTACT_LINKS,
  DEFAULT_WIDGET_SKILL_TAGS,
} from "./types";
import { DEFAULT_PORTFOLIO, DEFAULT_BACKGROUND } from "./defaults";
import {
  inferMediaTypeFromUrl,
  isFileVideoUrl,
  isXUrl,
  isYoutubeUrl,
} from "./utils";
import { getL, liftToLocalized, mergeMissingLocales } from "./i18n-content";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/locales";
import type { LocalizedString, MaybeLocalized } from "./i18n-content";

export const STORAGE_KEY = "mon-portfolio-v2-data";

function normalizeMediaType(
  raw: string | undefined,
  videoUrl: string | null
): ProjectMediaType {
  if (raw === "image" || raw === "youtube" || raw === "x") return raw;
  if (raw === "video") {
    return inferMediaTypeFromUrl(videoUrl) ?? "youtube";
  }
  if (videoUrl) {
    return inferMediaTypeFromUrl(videoUrl) ?? "image";
  }
  return "image";
}

function normalizeMediaItems(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Partial<MediaItem> & { id?: string; url?: string } =>
      Boolean(m && typeof m === "object")
    )
    .map((m, i) => {
      const url = typeof m.url === "string" ? m.url : "";
      let type = m.type as MediaItem["type"] | undefined;
      if (type !== "image" && type !== "youtube" && type !== "x" && type !== "file") {
        if (isYoutubeUrl(url)) type = "youtube";
        else if (isXUrl(url)) type = "x";
        else if (isFileVideoUrl(url)) type = "file";
        else type = "image";
      }
      return {
        id: m.id || `media-${i}-${Date.now()}`,
        type,
        url,
        caption: m.caption,
      };
    })
    .filter((m) => m.url);
}

function normalizeProject(
  p: Partial<Project> & { id: string; mediaType?: string }
): Project {
  const videoUrl = p.videoUrl ?? null;
  const mediaType = normalizeMediaType(p.mediaType, videoUrl);
  let finalUrl = videoUrl;
  if (mediaType === "youtube" && !finalUrl && p.link && isYoutubeUrl(p.link)) {
    finalUrl = p.link;
  }
  if (mediaType === "x" && !finalUrl && p.link && isXUrl(p.link)) {
    finalUrl = p.link;
  }
  return {
    id: p.id,
    title: liftToLocalized(p.title ?? "Projet"),
    description: liftToLocalized(p.description ?? ""),
    longDescription:
      p.longDescription != null
        ? liftToLocalized(p.longDescription)
        : undefined,
    mediaType,
    image: p.image ?? null,
    videoUrl: mediaType === "image" ? null : finalUrl,
    tags: p.tags ?? [],
    link: p.link,
    github: p.github,
  };
}

function normalizeLanguageVideoType(
  raw: string | undefined,
  videoUrl: string | null
): LanguageVideoType {
  if (raw === "none" || raw === "file" || raw === "youtube" || raw === "x") {
    return raw;
  }
  if (!videoUrl) return "none";
  if (isYoutubeUrl(videoUrl)) return "youtube";
  if (isXUrl(videoUrl)) return "x";
  if (isFileVideoUrl(videoUrl)) return "file";
  return "none";
}

function normalizeLanguage(
  l: Partial<Language> & {
    id: string;
    videoType?: string;
    icons?: Language["icons"];
    outlines?: Language["outlines"];
  }
): Language {
  const videoUrl = l.videoUrl ?? null;
  let videoType = normalizeLanguageVideoType(l.videoType, videoUrl);
  if (videoType !== "none" && !videoUrl) videoType = "none";

  const nameLifted = liftToLocalized(l.name ?? "Langue");
  if (!nameLifted.fr) nameLifted.fr = "Langue";
  const n = getL(nameLifted, "fr").toLowerCase();
  const defPrimary = n.includes("angl")
    ? "GB"
    : n.includes("polon")
      ? "PL"
      : "FR";
  const defRegions =
    n.includes("angl") || n.includes("english")
      ? ["GB", "US", "CA", "AU", "IE"]
      : n.includes("polon") || n.includes("polish")
        ? ["PL", "LT", "DE"]
        : n.includes("franç") || n.includes("french")
          ? ["FR", "BE", "CH", "CA"]
          : [defPrimary];

  const primaryRegion = (l.primaryRegion || defPrimary).toUpperCase();
  const legacyRegions =
    Array.isArray(l.regions) && l.regions.length > 0
      ? l.regions
          .map((r) => String(r).toUpperCase())
          .filter((r) => r.length === 2)
      : defRegions;

  // outlines: use new array or migrate from regions[]
  let outlines = Array.isArray(l.outlines) ? l.outlines.filter(Boolean) : [];
  if (outlines.length === 0) {
    outlines = legacyRegions.map((code, i) => ({
      id: `ol-${l.id}-${code}-${i}`,
      code,
      label: code,
    }));
  }

  const regionCodes = [
    ...new Set(
      [
        ...outlines.map((o) => o.code?.toUpperCase()).filter(Boolean),
        ...legacyRegions,
      ] as string[]
    ),
  ];

  // icons: migrate then filter to associated countries only
  let icons = Array.isArray(l.icons) ? l.icons.filter(Boolean) : [];
  if (icons.length === 0) {
    const style =
      l.iconStyle === "flag" ||
      l.iconStyle === "monument" ||
      l.iconStyle === "culture" ||
      l.iconStyle === "outline"
        ? l.iconStyle
        : "flag";
    icons = [
      {
        id: `icon-${l.id}-0`,
        kind: style,
        region: primaryRegion,
      },
    ];
  }

  // Dynamic import avoided — inline filter logic matching language-regions
  const allowed = new Set(regionCodes);
  icons = icons
    .map((icon) => {
      if (icon.kind === "upload") return icon;
      const region = (icon.region || "").toUpperCase();
      if (!region || (allowed.size > 0 && !allowed.has(region))) return null;
      return { ...icon, region };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  if (icons.length === 0 && regionCodes.length > 0) {
    icons = regionCodes.flatMap((code, i) => [
      { id: `${l.id}-f-${code}`, kind: "flag" as const, region: code },
      {
        id: `${l.id}-m-${code}`,
        kind: "monument" as const,
        region: code,
      },
    ]);
  }

  return {
    id: l.id,
    name: nameLifted,
    level: liftToLocalized(l.level ?? ""),
    videoType,
    videoUrl: videoType === "none" ? null : videoUrl,
    icons,
    outlines: outlines.map((o) => ({
      ...o,
      label: o.label != null ? liftToLocalized(o.label) : undefined,
    })),
    iconStyle: l.iconStyle,
    primaryRegion,
    regions: regionCodes.length ? regionCodes : legacyRegions,
  };
}

function normalizeExperience(
  e: Partial<Experience> & { id: string }
): Experience {
  return {
    id: e.id,
    company: liftToLocalized(e.company ?? ""),
    role: liftToLocalized(e.role ?? ""),
    location:
      e.location != null ? liftToLocalized(e.location) : undefined,
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? null,
    description: liftToLocalized(e.description ?? ""),
    technologies: e.technologies,
    media: normalizeMediaItems(e.media),
  };
}

function normalizeEducation(e: Partial<Education> & { id: string }): Education {
  return {
    id: e.id,
    year: e.year ?? "",
    degree: liftToLocalized(e.degree ?? ""),
    school: liftToLocalized(e.school ?? ""),
    detail: e.detail != null ? liftToLocalized(e.detail) : undefined,
    media: normalizeMediaItems(e.media),
  };
}

const QUICK_ICONS: QuickContactIcon[] = [
  "mail",
  "phone",
  "play",
  "link",
  "linkedin",
  "instagram",
  "youtube",
  "map",
  "message",
  "globe",
];

function normalizeQuickContactLinks(raw: unknown): QuickContactLink[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_QUICK_CONTACT_LINKS.map((l) => ({ ...l }));
  }
  return raw
    .filter((item): item is Partial<QuickContactLink> =>
      Boolean(item && typeof item === "object")
    )
    .map((item, i) => {
      const icon = QUICK_ICONS.includes(item.icon as QuickContactIcon)
        ? (item.icon as QuickContactIcon)
        : "link";
      return {
        id: item.id || `qc-${i}-${Date.now()}`,
        icon,
        label: liftToLocalized(item.label || "Lien"),
        href: (item.href || "#").trim() || "#",
      };
    });
}

function normalizeWidgetSkillTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [...DEFAULT_WIDGET_SKILL_TAGS];
  }
  return raw
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);
}

function normalizeSkillIcons(raw: unknown): SkillIcon[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Partial<SkillIcon> =>
      Boolean(item && typeof item === "object")
    )
    .map((item, i) => ({
      id: typeof item.id === "string" && item.id ? item.id : `sk-icon-${i}`,
      emoji:
        typeof item.emoji === "string" && item.emoji.trim()
          ? item.emoji.trim()
          : undefined,
      src:
        typeof item.src === "string" && item.src
          ? item.src
          : item.src === null
            ? null
            : undefined,
      label:
        typeof item.label === "string" && item.label.trim()
          ? item.label.trim()
          : undefined,
    }))
    .filter((ic) => Boolean(ic.emoji || ic.src));
}

function normalizeSkill(raw: Partial<Skill> | undefined): Skill {
  const base = raw && typeof raw === "object" ? raw : {};
  const nameLifted = liftToLocalized(base.name as string | undefined);
  if (!nameLifted.fr && typeof base.name === "string") {
    nameLifted.fr = base.name.trim() || "Compétence";
  }
  if (!nameLifted.fr) nameLifted.fr = "Compétence";
  return {
    id: typeof base.id === "string" && base.id ? base.id : `skill-${Date.now()}`,
    name: nameLifted,
    level:
      typeof base.level === "number"
        ? Math.min(100, Math.max(0, base.level))
        : undefined,
    category: base.category != null ? liftToLocalized(base.category as never) : undefined,
    description:
      base.description != null
        ? liftToLocalized(base.description as never)
        : undefined,
    image:
      typeof base.image === "string"
        ? base.image
        : base.image === null
          ? null
          : undefined,
    icons: normalizeSkillIcons(base.icons).map((ic) => ({
      ...ic,
      label: ic.label != null ? liftToLocalized(ic.label as never) : undefined,
    })),
  };
}

function liftContact(c: ContactConfig): ContactConfig {
  return {
    ...c,
    sectionEyebrow: liftToLocalized(c.sectionEyebrow),
    sectionTitle: liftToLocalized(c.sectionTitle),
    introText: liftToLocalized(c.introText),
    emailLabel: liftToLocalized(c.emailLabel),
    phoneLabel: liftToLocalized(c.phoneLabel),
    showreelLabel: liftToLocalized(c.showreelLabel),
    copyEmailLabel: liftToLocalized(c.copyEmailLabel),
    formTitle: liftToLocalized(c.formTitle),
    formSubmitLabel: liftToLocalized(c.formSubmitLabel),
    heroShowreelLabel: liftToLocalized(c.heroShowreelLabel),
    heroCvLabel: liftToLocalized(c.heroCvLabel),
    heroPhoneLabel: liftToLocalized(c.heroPhoneLabel),
    heroEmailLabel: liftToLocalized(c.heroEmailLabel),
    heroXLabel: liftToLocalized(c.heroXLabel),
    widgetQuickContactTitle: liftToLocalized(c.widgetQuickContactTitle),
    widgetSkillsTitle: liftToLocalized(c.widgetSkillsTitle),
    widgetAvailabilityTitle: liftToLocalized(c.widgetAvailabilityTitle),
    widgetAvailabilityText: liftToLocalized(c.widgetAvailabilityText),
    widgetXFeedTitle: liftToLocalized(c.widgetXFeedTitle),
    quickContactLinks: (c.quickContactLinks ?? []).map((l) => ({
      ...l,
      label: liftToLocalized(l.label),
    })),
  };
}

function normalizeContact(raw: Partial<ContactConfig> | undefined): ContactConfig {
  const base = { ...DEFAULT_CONTACT, ...raw };
  return liftContact({
    ...base,
    quickContactLinks: normalizeQuickContactLinks(raw?.quickContactLinks),
    widgetSkillTags: normalizeWidgetSkillTags(raw?.widgetSkillTags),
  });
}

function normalizeVideoType(
  raw: string | undefined,
  videoUrl: string | null
): FeatureVideoType {
  if (
    raw === "none" ||
    raw === "youtube" ||
    raw === "x" ||
    raw === "file"
  ) {
    return raw;
  }
  if (videoUrl && isYoutubeUrl(videoUrl)) return "youtube";
  if (videoUrl && isXUrl(videoUrl)) return "x";
  if (videoUrl && isFileVideoUrl(videoUrl)) return "file";
  return "none";
}

function normalizeFeatureVideos(raw: unknown): FeatureVideo[] {
  const defaults = DEFAULT_FEATURE_VIDEOS.map((f) => ({ ...f }));
  if (!Array.isArray(raw)) return defaults;

  return defaults.map((slot, i) => {
    const item = raw[i] as Partial<FeatureVideo> | undefined;
    if (!item) return slot;
    const videoUrl = item.videoUrl ?? null;
    let videoType = normalizeVideoType(item.videoType, videoUrl);
    if (videoType !== "none" && !videoUrl) videoType = "none";
    return {
      id: item.id || slot.id,
      title: liftToLocalized(
        (item.title as string | undefined) || (slot.title as string)
      ),
      videoType,
      videoUrl: videoType === "none" ? null : videoUrl,
    };
  });
}

function normalizeMainShowreel(
  raw: Partial<MainShowreel> | undefined,
  legacyShowreelUrl?: string
): MainShowreel {
  if (raw && (raw.videoType || raw.videoUrl || raw.title)) {
    const videoUrl = raw.videoUrl ?? null;
    let videoType = normalizeVideoType(raw.videoType, videoUrl);
    if (videoType !== "none" && !videoUrl) videoType = "none";
    return {
      title: liftToLocalized(
        (raw.title as string | undefined) ||
          (DEFAULT_MAIN_SHOWREEL.title as string)
      ),
      videoType,
      videoUrl: videoType === "none" ? null : videoUrl,
    };
  }
  // Migrate from profile.showreelUrl
  if (legacyShowreelUrl && isYoutubeUrl(legacyShowreelUrl)) {
    return {
      title: liftToLocalized(DEFAULT_MAIN_SHOWREEL.title as string),
      videoType: "youtube",
      videoUrl: legacyShowreelUrl,
    };
  }
  return {
    ...DEFAULT_MAIN_SHOWREEL,
    title: liftToLocalized(DEFAULT_MAIN_SHOWREEL.title as string),
  };
}

export function loadPortfolio(): PortfolioData {
  if (typeof window === "undefined") {
    return structuredClone(DEFAULT_PORTFOLIO);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_PORTFOLIO);

    const parsed = JSON.parse(raw) as Partial<PortfolioData> & {
      projects?: Array<Partial<Project> & { id: string; mediaType?: string }>;
      languages?: Array<Partial<Language> & { id: string; videoType?: string }>;
      experiences?: Array<Partial<Experience> & { id: string }>;
      education?: Array<Partial<Education> & { id: string }>;
      contact?: Partial<ContactConfig>;
    };

    if (!parsed.version || parsed.version < 3) {
      const fresh = structuredClone(DEFAULT_PORTFOLIO);
      savePortfolio(fresh);
      return fresh;
    }

    const mergedProfile = {
      ...DEFAULT_PORTFOLIO.profile,
      ...parsed.profile,
    };

    const data: PortfolioData = {
      version: DATA_VERSION,
      backgroundUrl: parsed.backgroundUrl || DEFAULT_BACKGROUND,
      ui: {
        overlayOpacity:
          parsed.ui?.overlayOpacity ?? DEFAULT_PORTFOLIO.ui.overlayOpacity,
        showDock: parsed.ui?.showDock ?? DEFAULT_PORTFOLIO.ui.showDock,
        locale: isLocale(parsed.ui?.locale)
          ? parsed.ui!.locale
          : DEFAULT_LOCALE,
      },
      profile: {
        ...mergedProfile,
        title: liftToLocalized(mergedProfile.title),
        bio: liftToLocalized(mergedProfile.bio),
        location: liftToLocalized(mergedProfile.location),
      },
      experiences: (parsed.experiences ?? DEFAULT_PORTFOLIO.experiences).map(
        normalizeExperience
      ),
      projects: (parsed.projects ?? DEFAULT_PORTFOLIO.projects).map(
        normalizeProject
      ),
      skills: (parsed.skills ?? DEFAULT_PORTFOLIO.skills).map(normalizeSkill),
      education: (parsed.education ?? DEFAULT_PORTFOLIO.education).map(
        normalizeEducation
      ),
      languages: (parsed.languages ?? DEFAULT_PORTFOLIO.languages).map(
        normalizeLanguage
      ),
      contact: normalizeContact(parsed.contact),
      mainShowreel: normalizeMainShowreel(
        parsed.mainShowreel,
        parsed.profile?.showreelUrl
      ),
      featureVideos: normalizeFeatureVideos(parsed.featureVideos),
    };

    // Fill missing EN/PL/ES from defaults when IDs match (keep user FR edits)
    const enriched = enrichFromDefaults(data);

    if (parsed.version < DATA_VERSION) {
      savePortfolio(enriched);
    }

    return enriched;
  } catch {
    return structuredClone(DEFAULT_PORTFOLIO);
  }
}

/** Merge default translations for known entities without overwriting user values */
function enrichFromDefaults(data: PortfolioData): PortfolioData {
  const d = DEFAULT_PORTFOLIO;
  const fill = (cur: MaybeLocalized, seed: MaybeLocalized) =>
    mergeMissingLocales(cur, seed);

  return {
    ...data,
    profile: {
      ...data.profile,
      title: fill(data.profile.title, d.profile.title),
      bio: fill(data.profile.bio, d.profile.bio),
      location: fill(data.profile.location, d.profile.location),
    },
    experiences: data.experiences.map((e) => {
      const seed = d.experiences.find((x) => x.id === e.id);
      if (!seed) return e;
      return {
        ...e,
        company: fill(e.company, seed.company),
        role: fill(e.role, seed.role),
        location:
          e.location != null || seed.location != null
            ? fill(e.location, seed.location)
            : e.location,
        description: fill(e.description, seed.description),
      };
    }),
    projects: data.projects.map((p) => {
      const seed = d.projects.find((x) => x.id === p.id);
      if (!seed) return p;
      return {
        ...p,
        title: fill(p.title, seed.title),
        description: fill(p.description, seed.description),
        longDescription:
          p.longDescription != null || seed.longDescription != null
            ? fill(p.longDescription, seed.longDescription)
            : p.longDescription,
      };
    }),
    skills: data.skills.map((s) => {
      const seed = d.skills.find((x) => x.id === s.id);
      if (!seed) return s;
      return {
        ...s,
        name: fill(s.name, seed.name),
        category:
          s.category != null || seed.category != null
            ? fill(s.category, seed.category)
            : s.category,
        description:
          s.description != null || seed.description != null
            ? fill(s.description, seed.description)
            : s.description,
      };
    }),
    education: data.education.map((e) => {
      const seed = d.education.find((x) => x.id === e.id);
      if (!seed) return e;
      return {
        ...e,
        degree: fill(e.degree, seed.degree),
        school: fill(e.school, seed.school),
        detail:
          e.detail != null || seed.detail != null
            ? fill(e.detail, seed.detail)
            : e.detail,
      };
    }),
    languages: data.languages.map((lang) => {
      const seed = d.languages.find((x) => x.id === lang.id);
      if (!seed) return lang;
      return {
        ...lang,
        name: fill(lang.name, seed.name),
        level: fill(lang.level, seed.level),
        outlines: lang.outlines.map((o) => {
          const so = seed.outlines.find((x) => x.id === o.id || x.code === o.code);
          return {
            ...o,
            label:
              o.label != null || so?.label != null
                ? fill(o.label, so?.label)
                : o.label,
          };
        }),
      };
    }),
    contact: {
      ...data.contact,
      sectionEyebrow: fill(data.contact.sectionEyebrow, d.contact.sectionEyebrow),
      sectionTitle: fill(data.contact.sectionTitle, d.contact.sectionTitle),
      introText: fill(data.contact.introText, d.contact.introText),
      emailLabel: fill(data.contact.emailLabel, d.contact.emailLabel),
      phoneLabel: fill(data.contact.phoneLabel, d.contact.phoneLabel),
      showreelLabel: fill(data.contact.showreelLabel, d.contact.showreelLabel),
      formTitle: fill(data.contact.formTitle, d.contact.formTitle),
      formSubmitLabel: fill(
        data.contact.formSubmitLabel,
        d.contact.formSubmitLabel
      ),
      heroShowreelLabel: fill(
        data.contact.heroShowreelLabel,
        d.contact.heroShowreelLabel
      ),
      heroCvLabel: fill(data.contact.heroCvLabel, d.contact.heroCvLabel),
      heroXLabel: fill(data.contact.heroXLabel, d.contact.heroXLabel),
      widgetQuickContactTitle: fill(
        data.contact.widgetQuickContactTitle,
        d.contact.widgetQuickContactTitle
      ),
      widgetSkillsTitle: fill(
        data.contact.widgetSkillsTitle,
        d.contact.widgetSkillsTitle
      ),
      widgetAvailabilityTitle: fill(
        data.contact.widgetAvailabilityTitle,
        d.contact.widgetAvailabilityTitle
      ),
      widgetAvailabilityText: fill(
        data.contact.widgetAvailabilityText,
        d.contact.widgetAvailabilityText
      ),
      widgetXFeedTitle: fill(
        data.contact.widgetXFeedTitle,
        d.contact.widgetXFeedTitle
      ),
    },
  };
}

export function savePortfolio(data: PortfolioData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, version: DATA_VERSION })
    );
  } catch (e) {
    console.error("Impossible de sauvegarder (quota localStorage ?)", e);
    throw e;
  }
}
