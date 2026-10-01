import type {
  BackgroundImage,
  ContactConfig,
  Education,
  Experience,
  ExtraDocument,
  ExtraDocumentId,
  ExtraDocumentsConfig,
  FeatureVideo,
  FeatureVideoType,
  HeroBadge,
  Language,
  LanguageVideoType,
  MainShowreel,
  MediaItem,
  PortfolioData,
  Profile,
  Project,
  ProjectMediaType,
  QuickContactIcon,
  QuickContactLink,
  HeroGlassBackMedia,
  HeroGlassConfig,
  HeroGlassFrontLayer,
  QuoteService,
  QuoteServiceId,
  QuotesConfig,
  ComingSoonConfig,
  NavConfig,
  NavItemId,
  SectionLabelsConfig,
  Skill,
  SkillIcon,
  SocialConfig,
  SocialPost,
  SocialPostFileKind,
  NotesCategory,
  Translatable,
} from "./types";
import {
  DATA_VERSION,
  DEFAULT_ALPHA_VIDEO_OPACITY,
  DEFAULT_COMING_SOON,
  DEFAULT_CONTACT,
  DEFAULT_EXPERIENCE_BADGE,
  DEFAULT_EXTRA_DOCUMENTS,
  DEFAULT_FEATURE_VIDEOS,
  DEFAULT_HERO_GLASS,
  DEFAULT_MAIN_SHOWREEL,
  DEFAULT_NAV,
  DEFAULT_QUICK_CONTACT_LINKS,
  DEFAULT_QUOTES,
  DEFAULT_SECTION_LABELS,
  DEFAULT_SOCIAL,
  DEFAULT_SOCIAL_POSTS,
  DEFAULT_WIDGET_SKILL_TAGS,
  EXTRA_DOCUMENT_IDS,
  NAV_ITEM_IDS,
  QUOTE_SERVICE_IDS,
} from "./types";
import { DEFAULT_PORTFOLIO, DEFAULT_BACKGROUND } from "./defaults";
import {
  createId,
  inferMediaTypeFromUrl,
  isFileVideoUrl,
  isXUrl,
  isYoutubeUrl,
} from "./utils";
import { getL, liftToLocalized, mergeMissingLocales } from "./i18n-content";
import { expandLocalizedSync } from "./auto-localize";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/locales";
import type { LocalizedString, MaybeLocalized } from "./i18n-content";
import { normalizeCompactRichBody, normalizeRichBody } from "./rich-format";
import { extractRichSpacing, wrapWithRichSpacing } from "./rich-spacing";
import { looksLikeHtml, sanitizeBioHtml } from "./sanitize-html";

export const STORAGE_KEY = "mon-portfolio-v2-data";
export const STORAGE_BACKUP_KEY = "mon-portfolio-v2-data-backup";

function cleanRichString(value: string, compact = false): string {
  if (!value || typeof document === "undefined" || !looksLikeHtml(value)) return value || "";
  const { lineHeight, body } = extractRichSpacing(value);
  const normalized = compact
    ? normalizeCompactRichBody(body || value)
    : normalizeRichBody(body || value);
  return wrapWithRichSpacing(sanitizeBioHtml(normalized), lineHeight);
}

function cleanMaybeLocalized(value: Translatable, compact = false): Translatable {
  if (typeof value === "string") return cleanRichString(value, compact);
  if (!value || typeof value !== "object") return value;
  const next: LocalizedString = { ...value };
  for (const loc of ["fr", "en", "pl", "es"] as const) {
    if (typeof next[loc] === "string") next[loc] = cleanRichString(next[loc]!, compact);
  }
  return next;
}

function cleanPortfolioRichText(data: PortfolioData): PortfolioData {
  return {
    ...data,
    profile: {
      ...data.profile,
      name: cleanRichString(data.profile.name || "", true),
      title: cleanMaybeLocalized(data.profile.title, true),
      bio: cleanMaybeLocalized(data.profile.bio, false),
      heroBadges: (data.profile.heroBadges ?? []).map((badge) => ({
        ...badge,
        text: cleanMaybeLocalized(badge.text, true),
      })),
    },
    experiences: data.experiences.map((exp) => ({
      ...exp,
      description: cleanMaybeLocalized(exp.description, false),
    })),
    education: data.education.map((edu) => ({
      ...edu,
      detail: edu.detail != null ? cleanMaybeLocalized(edu.detail, false) : edu.detail,
    })),
    socialPosts: (data.socialPosts ?? []).map((post) => ({
      ...post,
      description: cleanMaybeLocalized(post.description, false),
    })),
  };
}

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

  // Expand known language names / levels to FR·EN·PL·ES immediately on load
  const nameLifted = expandLocalizedSync(l.name ?? "Langue");
  if (!nameLifted.fr) nameLifted.fr = getL(nameLifted) || "Langue";
  const levelLifted = expandLocalizedSync(l.level ?? "");
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

  const fallbackImageUrl =
    typeof l.fallbackImageUrl === "string" && l.fallbackImageUrl.trim()
      ? l.fallbackImageUrl.trim()
      : null;

  return {
    id: l.id,
    name: nameLifted,
    level: levelLifted,
    videoType,
    videoUrl: videoType === "none" ? null : videoUrl,
    fallbackImageUrl: videoType === "none" ? null : fallbackImageUrl,
    icons,
    outlines: outlines.map((o) => ({
      ...o,
      label:
        o.label != null
          ? expandLocalizedSync(o.label)
          : o.code
            ? expandLocalizedSync(o.code)
            : undefined,
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

  const cleaned = raw.filter((item) => {
    if (!item || typeof item !== "object") return true;
    const link = item as Partial<QuickContactLink>;
    return (
      link.icon !== "phone" &&
      !String(link.href ?? "").trim().toLowerCase().startsWith("tel:")
    );
  });
  return cleaned
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

function seedMissingLocales(value: LocalizedString): LocalizedString {
  const seed =
    value.fr?.trim() ||
    value.en?.trim() ||
    value.pl?.trim() ||
    value.es?.trim() ||
    "";
  if (!seed) return value;
  const out: LocalizedString = { ...value };
  for (const loc of ["fr", "en", "pl", "es"] as const) {
    if (!out[loc]?.trim()) out[loc] = seed;
  }
  return out;
}

function normalizeSkill(raw: Partial<Skill> | undefined): Skill {
  const base = raw && typeof raw === "object" ? raw : {};
  let nameLifted = liftToLocalized(base.name as string | undefined);
  if (!nameLifted.fr && typeof base.name === "string") {
    nameLifted.fr = base.name.trim() || "Compétence";
  }
  // Prefer any existing locale as seed — never invent "Compétence" if EN/PL/ES exist
  const anyName =
    nameLifted.fr?.trim() ||
    nameLifted.en?.trim() ||
    nameLifted.pl?.trim() ||
    nameLifted.es?.trim();
  if (!anyName) {
    nameLifted = { fr: "Compétence", en: "Skill", pl: "Umiejętność", es: "Competencia" };
  } else {
    nameLifted = seedMissingLocales(nameLifted);
  }

  let category =
    base.category != null
      ? liftToLocalized(base.category as never)
      : undefined;
  if (category && Object.keys(category).length > 0) {
    category = seedMissingLocales(category);
  }

  let description =
    base.description != null
      ? liftToLocalized(base.description as never)
      : undefined;
  if (description && Object.keys(description).length > 0) {
    description = seedMissingLocales(description);
  }

  return {
    id: typeof base.id === "string" && base.id ? base.id : `skill-${Date.now()}`,
    name: nameLifted,
    level:
      typeof base.level === "number"
        ? Math.min(100, Math.max(0, base.level))
        : undefined,
    category,
    description,
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

function normalizeExtraDocuments(raw: unknown): ExtraDocumentsConfig {
  const source =
    raw && typeof raw === "object"
      ? (raw as Partial<Record<ExtraDocumentId, Partial<ExtraDocument>>>)
      : {};

  const result = {} as ExtraDocumentsConfig;
  for (const id of EXTRA_DOCUMENT_IDS) {
    const def = DEFAULT_EXTRA_DOCUMENTS[id];
    const item = source[id];
    const url =
      typeof item?.url === "string"
        ? item.url.trim() || null
        : item?.url === null
          ? null
          : def.url;
    result[id] = {
      url,
      show: typeof item?.show === "boolean" ? item.show : def.show,
      label: liftToLocalized(
        item?.label != null ? item.label : def.label
      ),
      showInHero:
        typeof item?.showInHero === "boolean"
          ? item.showInHero
          : def.showInHero,
      showInContact:
        typeof item?.showInContact === "boolean"
          ? item.showInContact
          : def.showInContact,
    };
  }
  return result;
}

function liftContact(c: ContactConfig): ContactConfig {
  const docs = normalizeExtraDocuments(c.extraDocuments);
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
    extraDocuments: docs,
    widgetQuickContactTitle: liftToLocalized(c.widgetQuickContactTitle),
    widgetSkillsTitle: liftToLocalized(c.widgetSkillsTitle),
    widgetAvailabilityTitle: liftToLocalized(c.widgetAvailabilityTitle),
    widgetAvailabilityText: liftToLocalized(c.widgetAvailabilityText),
    quickContactLinks: (c.quickContactLinks ?? [])
      .filter(
        (l) =>
          l.icon !== "phone" &&
          !String(l.href ?? "").trim().toLowerCase().startsWith("tel:")
      )
      .map((l) => ({
        ...l,
        label: liftToLocalized(l.label),
      })),
  };
}

function normalizeSectionLabels(
  raw: Partial<SectionLabelsConfig> | undefined,
  legacyLanguagesSection?: { description?: unknown }
): SectionLabelsConfig {
  const base = { ...DEFAULT_SECTION_LABELS, ...raw };
  // Migrate old languagesSection.description if present
  const legacyDesc =
    legacyLanguagesSection?.description != null
      ? liftToLocalized(legacyLanguagesSection.description as never)
      : undefined;
  return {
    experienceEyebrow: liftToLocalized(
      base.experienceEyebrow ?? DEFAULT_SECTION_LABELS.experienceEyebrow
    ),
    projectsEyebrow: liftToLocalized(
      base.projectsEyebrow ?? DEFAULT_SECTION_LABELS.projectsEyebrow
    ),
    skillsEyebrow: liftToLocalized(
      base.skillsEyebrow ?? DEFAULT_SECTION_LABELS.skillsEyebrow
    ),
    educationEyebrow: liftToLocalized(
      base.educationEyebrow ?? DEFAULT_SECTION_LABELS.educationEyebrow
    ),
    languagesEyebrow: liftToLocalized(
      base.languagesEyebrow ?? DEFAULT_SECTION_LABELS.languagesEyebrow
    ),
    languagesDescription: liftToLocalized(
      base.languagesDescription ??
        legacyDesc ??
        DEFAULT_SECTION_LABELS.languagesDescription
    ),
  };
}

export function normalizeNav(
  raw: Partial<Record<NavItemId, Partial<{ label: unknown; visible: unknown }>>> | undefined
): NavConfig {
  const out = {} as NavConfig;
  for (const id of NAV_ITEM_IDS) {
    const def = DEFAULT_NAV[id];
    const item = raw?.[id];
    out[id] = {
      label: liftToLocalized(
        item?.label != null ? (item.label as never) : def.label
      ),
      visible:
        typeof item?.visible === "boolean" ? item.visible : def.visible,
    };
    // Empty label → fall back to default so nav never shows blank
    if (!getL(out[id].label).trim()) {
      out[id].label = liftToLocalized(def.label);
    }
  }
  return out;
}

export function normalizeSocial(
  raw: Partial<SocialConfig> | undefined
): SocialConfig {
  return {
    eyebrow: liftToLocalized(
      raw?.eyebrow != null ? (raw.eyebrow as never) : DEFAULT_SOCIAL.eyebrow
    ),
    title: liftToLocalized(
      raw?.title != null ? (raw.title as never) : DEFAULT_SOCIAL.title
    ),
    description: liftToLocalized(
      raw?.description != null
        ? (raw.description as never)
        : DEFAULT_SOCIAL.description
    ),
  };
}

function inferSocialFileKind(
  url: string | null,
  hinted: unknown
): SocialPostFileKind | null {
  if (hinted === "pdf" || hinted === "image") return hinted;
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes(".pdf") || /\/raw\//i.test(lower)) return "pdf";
  if (/\.(png|jpe?g|webp|gif|avif|svg|bmp)(\?|#|$)/i.test(lower)) return "image";
  return "pdf";
}

export function normalizeSocialPost(
  raw: Partial<SocialPost> | undefined,
  index = 0
): SocialPost | null {
  if (!raw || typeof raw !== "object") return null;
  const youtubeUrl =
    typeof raw.youtubeUrl === "string" && raw.youtubeUrl.trim()
      ? raw.youtubeUrl.trim()
      : null;
  const fileUrl =
    typeof raw.fileUrl === "string" && raw.fileUrl.trim()
      ? raw.fileUrl.trim()
      : null;
  const dateRaw = typeof raw.date === "string" ? raw.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
    ? dateRaw
    : new Date().toISOString().slice(0, 10);
  const fileName =
    typeof raw.fileName === "string" && raw.fileName.trim()
      ? raw.fileName.trim()
      : null;
  const allowedCategories: NotesCategory[] = [
    "Livre",
    "Réflexions",
    "Documents",
    "Images",
    "Vidéos",
  ];
  const rawCategory =
    typeof raw.category === "string" ? raw.category.trim() : "";
  const inferredCategory: NotesCategory = youtubeUrl
    ? "Vidéos"
    : fileUrl && inferSocialFileKind(fileUrl, raw.fileKind) === "image"
      ? "Images"
      : fileUrl
        ? "Documents"
        : "Réflexions";
  const category = allowedCategories.includes(rawCategory as NotesCategory)
    ? (rawCategory as NotesCategory)
    : inferredCategory;
  return {
    id:
      typeof raw.id === "string" && raw.id
        ? raw.id
        : `social-${index}-${createId().slice(0, 8)}`,
    title: liftToLocalized(raw.title ?? ""),
    description: liftToLocalized(raw.description ?? ""),
    date,
    youtubeUrl,
    fileUrl,
    fileKind: fileUrl ? inferSocialFileKind(fileUrl, raw.fileKind) : null,
    fileName,
    category,
    tags: Array.isArray(raw.tags)
      ? raw.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean)
      : [],
    visible: typeof raw.visible === "boolean" ? raw.visible : true,
    order: typeof raw.order === "number" && !Number.isNaN(raw.order) ? raw.order : index,
  };
}

export function normalizeSocialPosts(raw: unknown): SocialPost[] {
  if (!Array.isArray(raw)) {
    return DEFAULT_SOCIAL_POSTS.map((p) => ({ ...p }));
  }
  return raw
    .map((item, i) =>
      normalizeSocialPost(item as Partial<SocialPost> | undefined, i)
    )
    .filter((p): p is SocialPost => Boolean(p));
}

export function normalizeComingSoon(
  raw: Partial<ComingSoonConfig> | undefined
): ComingSoonConfig {
  const title = liftToLocalized(
    raw?.title != null ? (raw.title as never) : DEFAULT_COMING_SOON.title
  );
  // Missing field → production default (currently ON). Explicit false stays false.
  const enabled =
    raw == null || typeof raw.enabled !== "boolean"
      ? DEFAULT_COMING_SOON.enabled
      : raw.enabled;
  return {
    enabled,
    title: getL(title).trim()
      ? title
      : liftToLocalized(DEFAULT_COMING_SOON.title),
  };
}

/** Drop legacy X/Twitter account fields from older localStorage / snapshots. */
function omitLegacyXAccount(
  raw: Partial<ContactConfig> | undefined
): Partial<ContactConfig> {
  if (!raw || typeof raw !== "object") return {};
  const rest = { ...(raw as Record<string, unknown>) };
  for (const key of [
    "showHeroX",
    "heroXLabel",
    "xProfileUrl",
    "showWidgetXFeed",
    "widgetXFeedTitle",
    "xUsername",
  ]) {
    delete rest[key];
  }
  return rest as Partial<ContactConfig>;
}

function normalizeContact(raw: Partial<ContactConfig> | undefined): ContactConfig {
  const cleaned = omitLegacyXAccount(raw);
  const base = { ...DEFAULT_CONTACT, ...cleaned };
  return liftContact({
    ...base,
    extraDocuments: normalizeExtraDocuments(raw?.extraDocuments),
    quickContactLinks: normalizeQuickContactLinks(raw?.quickContactLinks),
    widgetSkillTags: normalizeWidgetSkillTags(raw?.widgetSkillTags),
  });
}

function normalizeQuoteService(
  id: QuoteServiceId,
  raw: Partial<QuoteService> | undefined
): QuoteService {
  const def = DEFAULT_QUOTES.services.find((s) => s.id === id)!;
  return {
    id,
    show: typeof raw?.show === "boolean" ? raw.show : def.show,
    buttonLabel: liftToLocalized(
      raw?.buttonLabel != null ? raw.buttonLabel : def.buttonLabel
    ),
    pageTitle: liftToLocalized(
      raw?.pageTitle != null ? raw.pageTitle : def.pageTitle
    ),
    pageIntro: liftToLocalized(
      raw?.pageIntro != null ? raw.pageIntro : def.pageIntro
    ),
  };
}

/** Infer image vs video for legacy hero glass back items without `type`. */
export function inferHeroGlassBackType(url: string): "video" | "image" {
  const u = url.trim();
  if (!u) return "video";
  if (/\/video\/upload\//i.test(u)) return "video";
  if (/\/image\/upload\//i.test(u)) return "image";
  if (/\.(webm|mp4|mov|m4v|ogg|avi|mkv)(\?|#|$)/i.test(u)) return "video";
  if (/\.(png|jpe?g|webp|gif|avif|svg|bmp)(\?|#|$)/i.test(u)) return "image";
  return "video";
}

export function normalizeHeroGlass(raw: unknown): HeroGlassConfig {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<HeroGlassConfig>)
      : {};

  const backVideos: HeroGlassBackMedia[] = [];
  if (Array.isArray(r.backVideos)) {
    for (let i = 0; i < r.backVideos.length; i++) {
      const item = r.backVideos[i] as Partial<HeroGlassBackMedia> | undefined;
      if (!item || typeof item !== "object") continue;
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (!url) continue;
      const type: "video" | "image" =
        item.type === "image" || item.type === "video"
          ? item.type
          : inferHeroGlassBackType(url);
      const fallbackImageUrl =
        type === "video" &&
        typeof item.fallbackImageUrl === "string" &&
        item.fallbackImageUrl.trim()
          ? item.fallbackImageUrl.trim()
          : null;
      backVideos.push({
        id:
          typeof item.id === "string" && item.id
            ? item.id
            : `hg-back-${i}-${createId().slice(0, 8)}`,
        url,
        type,
        enabled: typeof item.enabled === "boolean" ? item.enabled : true,
        opacity: clampUnitOpacity(
          (item as { opacity?: unknown }).opacity,
          1
        ),
        fallbackImageUrl,
      });
    }
  }

  const frontRaw =
    r.front && typeof r.front === "object"
      ? (r.front as Partial<HeroGlassFrontLayer>)
      : {};
  const frontType =
    frontRaw.type === "video" || frontRaw.type === "image"
      ? frontRaw.type
      : "none";
  const frontUrl =
    typeof frontRaw.url === "string" && frontRaw.url.trim()
      ? frontRaw.url.trim()
      : null;
  const frontOpacity =
    typeof frontRaw.opacity === "number" && !Number.isNaN(frontRaw.opacity)
      ? Math.min(1, Math.max(0, frontRaw.opacity))
      : DEFAULT_HERO_GLASS.front.opacity;
  const frontFallback =
    frontType === "video" &&
    typeof frontRaw.fallbackImageUrl === "string" &&
    frontRaw.fallbackImageUrl.trim()
      ? frontRaw.fallbackImageUrl.trim()
      : null;

  return {
    backVideos,
    front: {
      type: frontUrl ? frontType : "none",
      url: frontType === "none" ? null : frontUrl,
      opacity: frontOpacity,
      fallbackImageUrl: frontFallback,
    },
  };
}

export function normalizeQuotes(raw: unknown): QuotesConfig {
  const r =
    raw && typeof raw === "object"
      ? (raw as Partial<QuotesConfig> & {
          services?: Partial<QuoteService>[];
        })
      : {};
  const byId = new Map<string, Partial<QuoteService>>();
  if (Array.isArray(r.services)) {
    for (const s of r.services) {
      if (s && typeof s === "object" && typeof s.id === "string") {
        byId.set(s.id, s);
      }
    }
  }
  return {
    sectionEyebrow: liftToLocalized(
      r.sectionEyebrow != null
        ? r.sectionEyebrow
        : DEFAULT_QUOTES.sectionEyebrow
    ),
    sectionTitle: liftToLocalized(
      r.sectionTitle != null ? r.sectionTitle : DEFAULT_QUOTES.sectionTitle
    ),
    sectionDescription: liftToLocalized(
      r.sectionDescription != null
        ? r.sectionDescription
        : DEFAULT_QUOTES.sectionDescription
    ),
    services: QUOTE_SERVICE_IDS.map((id) =>
      normalizeQuoteService(id, byId.get(id))
    ),
  };
}

function clampAlphaOpacity(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_ALPHA_VIDEO_OPACITY;
  }
  return Math.min(1, Math.max(0, value));
}

function clampUnitOpacity(value: unknown, fallback = 1): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

/** Build default badges from legacy location + experienceBadge fields */
export function defaultHeroBadgesFromProfile(
  profile: Partial<Profile>
): HeroBadge[] {
  const badges: HeroBadge[] = [];
  const loc = liftToLocalized(profile.location);
  if (Object.keys(loc).length > 0) {
    badges.push({
      id: "badge-location",
      text: loc,
      bgColor: "rgba(255,255,255,0.08)",
      textColor: "#e4e4e7",
    });
  }
  const exp = liftToLocalized(
    profile.experienceBadge ?? DEFAULT_EXPERIENCE_BADGE
  );
  if (Object.keys(exp).length > 0) {
    badges.push({
      id: "badge-experience",
      text: exp,
      bgColor: "rgba(251,191,36,0.15)",
      textColor: "#fef3c7",
    });
  }
  return badges;
}

export function normalizeHeroBadges(
  raw: unknown,
  profile: Partial<Profile>
): HeroBadge[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultHeroBadgesFromProfile(profile);
  }
  const out: HeroBadge[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const b = item as Partial<HeroBadge>;
    const text = liftToLocalized(b.text);
    if (Object.keys(text).length === 0) continue;
    out.push({
      id:
        typeof b.id === "string" && b.id
          ? b.id
          : `badge-${i}-${createId().slice(0, 6)}`,
      text,
      bgColor:
        typeof b.bgColor === "string" && b.bgColor.trim()
          ? b.bgColor.trim()
          : "rgba(255,255,255,0.08)",
      textColor:
        typeof b.textColor === "string" && b.textColor.trim()
          ? b.textColor.trim()
          : "#f4f4f5",
    });
  }
  return out.length > 0 ? out : defaultHeroBadgesFromProfile(profile);
}

function normalizeOneBackgroundImage(
  item: unknown,
  index: number
): BackgroundImage | null {
  if (typeof item === "string") {
    const url = item.trim();
    return url
      ? {
          id: `bg-migrated-${index}`,
          url,
          opacity: 1,
          alphaVideoUrl: null,
          alphaVideoEnabled: false,
          alphaVideoOpacity: DEFAULT_ALPHA_VIDEO_OPACITY,
        }
      : null;
  }
  if (!item || typeof item !== "object") return null;

  const obj = item as Partial<BackgroundImage>;
  const url = typeof obj.url === "string" ? obj.url.trim() : "";
  if (!url) return null;

  const alphaVideoUrl =
    typeof obj.alphaVideoUrl === "string" && obj.alphaVideoUrl.trim()
      ? obj.alphaVideoUrl.trim()
      : null;

  return {
    id:
      typeof obj.id === "string" && obj.id
        ? obj.id
        : `bg-${index}-${createId().slice(0, 8)}`,
    url,
    opacity: clampUnitOpacity(obj.opacity, 1),
    alphaVideoUrl,
    alphaVideoEnabled:
      typeof obj.alphaVideoEnabled === "boolean"
        ? obj.alphaVideoEnabled
        : Boolean(alphaVideoUrl),
    alphaVideoOpacity: clampAlphaOpacity(obj.alphaVideoOpacity),
  };
}

/**
 * Normalize wallpaper pool. Migrates legacy single `backgroundUrl` into an array.
 * Preserves optional alpha video overlays per image.
 */
export function normalizeBackgroundImages(
  raw: unknown,
  fallbackUrl?: string | null
): BackgroundImage[] {
  const fallback =
    (typeof fallbackUrl === "string" && fallbackUrl.trim()) ||
    DEFAULT_BACKGROUND;

  if (Array.isArray(raw) && raw.length > 0) {
    const list = raw
      .map((item, i) => normalizeOneBackgroundImage(item, i))
      .filter((x): x is BackgroundImage => Boolean(x));

    if (list.length > 0) return list;
  }

  return [
    {
      id: "bg-default",
      url: fallback,
      opacity: 1,
      alphaVideoUrl: null,
      alphaVideoEnabled: false,
      alphaVideoOpacity: DEFAULT_ALPHA_VIDEO_OPACITY,
    },
  ];
}

/** Pick a random wallpaper entry from the pool (client-side only). */
export function pickRandomBackground(
  images: BackgroundImage[] | undefined | null,
  fallbackUrl?: string | null
): BackgroundImage {
  const list = normalizeBackgroundImages(images, fallbackUrl);
  if (list.length === 1) return list[0];
  return list[Math.floor(Math.random() * list.length)];
}

/** Pick a random wallpaper URL from the pool (client-side only). */
export function pickRandomBackgroundUrl(
  images: BackgroundImage[] | undefined | null,
  fallbackUrl?: string | null
): string {
  return pickRandomBackground(images, fallbackUrl).url;
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
    const fallbackImageUrl =
      typeof item.fallbackImageUrl === "string" && item.fallbackImageUrl.trim()
        ? item.fallbackImageUrl.trim()
        : null;
    return {
      id: item.id || slot.id,
      title: liftToLocalized(
        (item.title as string | undefined) || (slot.title as string)
      ),
      description: liftToLocalized(
        (item.description as string | undefined) ||
          (slot.description as string | undefined)
      ),
      videoType,
      videoUrl: videoType === "none" ? null : videoUrl,
      fallbackImageUrl: videoType === "none" ? null : fallbackImageUrl,
    };
  });
}

function normalizeMainShowreel(
  raw: Partial<MainShowreel> | undefined,
  legacyShowreelUrl?: string
): MainShowreel {
  if (raw && (raw.videoType || raw.videoUrl || raw.title || raw.fallbackImageUrl)) {
    const videoUrl = raw.videoUrl ?? null;
    let videoType = normalizeVideoType(raw.videoType, videoUrl);
    if (videoType !== "none" && !videoUrl) videoType = "none";
    const fallbackImageUrl =
      typeof raw.fallbackImageUrl === "string" && raw.fallbackImageUrl.trim()
        ? raw.fallbackImageUrl.trim()
        : null;
    return {
      title: liftToLocalized(
        (raw.title as string | undefined) ||
          (DEFAULT_MAIN_SHOWREEL.title as string)
      ),
      videoType,
      videoUrl: videoType === "none" ? null : videoUrl,
      fallbackImageUrl: videoType === "none" ? null : fallbackImageUrl,
    };
  }
  // Migrate from profile.showreelUrl
  if (legacyShowreelUrl && isYoutubeUrl(legacyShowreelUrl)) {
    return {
      title: liftToLocalized(DEFAULT_MAIN_SHOWREEL.title as string),
      videoType: "youtube",
      videoUrl: legacyShowreelUrl,
      fallbackImageUrl: null,
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

    const backgroundImages = normalizeBackgroundImages(
      (parsed as { backgroundImages?: unknown }).backgroundImages,
      parsed.backgroundUrl
    );
    const backgroundUrl =
      (typeof parsed.backgroundUrl === "string" &&
        parsed.backgroundUrl.trim()) ||
      backgroundImages[0]?.url ||
      DEFAULT_BACKGROUND;

    const data: PortfolioData = {
      version: DATA_VERSION,
      backgroundUrl,
      backgroundImages,
      heroGlass: normalizeHeroGlass(
        (parsed as { heroGlass?: unknown }).heroGlass
      ),
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
        experienceBadge: liftToLocalized(
          mergedProfile.experienceBadge ??
            DEFAULT_PORTFOLIO.profile.experienceBadge ??
            DEFAULT_EXPERIENCE_BADGE
        ),
        heroBadges: normalizeHeroBadges(
          (mergedProfile as { heroBadges?: unknown }).heroBadges,
          mergedProfile
        ),
        heroFontFamily:
          typeof (mergedProfile as { heroFontFamily?: unknown })
            .heroFontFamily === "string"
            ? ((mergedProfile as { heroFontFamily?: string }).heroFontFamily ??
              "")
            : "",
      },
      experiences: (() => {
        // v30–31: full CV experience rewrite (job search + com block + atypical path)
        if ((parsed.version ?? 0) < 31) {
          const prevMedia = new Map(
            (parsed.experiences ?? []).map((e) => [
              e.id,
              normalizeMediaItems(e.media),
            ])
          );
          return DEFAULT_PORTFOLIO.experiences.map((e) =>
            normalizeExperience({
              ...e,
              media:
                prevMedia.get(e.id)?.length
                  ? prevMedia.get(e.id)
                  : e.media,
            })
          );
        }
        return (parsed.experiences ?? DEFAULT_PORTFOLIO.experiences).map(
          normalizeExperience
        );
      })(),
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
      sectionLabels: normalizeSectionLabels(
        (parsed as { sectionLabels?: Partial<SectionLabelsConfig> })
          .sectionLabels,
        (parsed as { languagesSection?: { description?: unknown } })
          .languagesSection
      ),
      nav: normalizeNav(
        (parsed as { nav?: Parameters<typeof normalizeNav>[0] }).nav
      ),
      comingSoon: normalizeComingSoon(
        (parsed as { comingSoon?: Partial<ComingSoonConfig> }).comingSoon
      ),
      contact: normalizeContact(parsed.contact),
      quotes: normalizeQuotes(
        (parsed as { quotes?: unknown }).quotes
      ),
      mainShowreel: normalizeMainShowreel(
        parsed.mainShowreel,
        parsed.profile?.showreelUrl
      ),
      // v33–34: rename + remap the 3 feature cards (Motion / Short-Form / AI)
      featureVideos:
        (parsed.version ?? 0) < 34
          ? structuredClone(DEFAULT_PORTFOLIO.featureVideos)
          : normalizeFeatureVideos(parsed.featureVideos),
      social: normalizeSocial(
        (parsed as { social?: Partial<SocialConfig> }).social
      ),
      socialPosts: normalizeSocialPosts(
        (parsed as { socialPosts?: unknown }).socialPosts
      ),
    };

    // v36: corrective migration. Restore the accidentally deleted
    // Solutions Prompteur experience and keep the public site on Coming Soon.
    // This intentionally reruns for installs that already migrated to v35.
    if ((parsed.version ?? 0) < 36) {
      if (!data.experiences.some((e) => e.id === "exp-prompteur")) {
        const seed = DEFAULT_PORTFOLIO.experiences.find(
          (e) => e.id === "exp-prompteur"
        );
        if (seed) {
          const restored = normalizeExperience(structuredClone(seed));
          const savIndex = data.experiences.findIndex((e) => e.id === "exp-sav");
          data.experiences.splice(savIndex >= 0 ? savIndex + 1 : 0, 0, restored);
        }
      }
      data.comingSoon.enabled = true;
      data.nav.projects.visible = false;
      data.nav.quotes.visible = false;
      data.contact.showEmail = false;
      data.contact.showHeroEmail = false;
    }

    // v39: compact legacy editor markup without changing the visible text.
    // This removes nested <strong>/<span font-size> chains that made Bold
    // impossible to toggle and caused formatting to appear to revert.
    const cleaned = (parsed.version ?? 0) < 39 ? cleanPortfolioRichText(data) : data;

    // Fill missing EN/PL/ES from defaults when IDs match (keep user FR edits)
    const enriched = enrichFromDefaults(cleaned);

    if ((parsed.version ?? 0) < DATA_VERSION) {
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
      experienceBadge: fill(
        data.profile.experienceBadge,
        d.profile.experienceBadge
      ),
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
    sectionLabels: {
      experienceEyebrow: fill(
        data.sectionLabels?.experienceEyebrow,
        d.sectionLabels.experienceEyebrow
      ),
      projectsEyebrow: fill(
        data.sectionLabels?.projectsEyebrow,
        d.sectionLabels.projectsEyebrow
      ),
      skillsEyebrow: fill(
        data.sectionLabels?.skillsEyebrow,
        d.sectionLabels.skillsEyebrow
      ),
      educationEyebrow: fill(
        data.sectionLabels?.educationEyebrow,
        d.sectionLabels.educationEyebrow
      ),
      languagesEyebrow: fill(
        data.sectionLabels?.languagesEyebrow,
        d.sectionLabels.languagesEyebrow
      ),
      languagesDescription: fill(
        data.sectionLabels?.languagesDescription ??
          data.languagesSection?.description,
        d.sectionLabels.languagesDescription
      ),
    },
    nav: (() => {
      const base = normalizeNav(data.nav as never);
      const seed = normalizeNav(d.nav as never);
      const out = {} as typeof base;
      for (const id of NAV_ITEM_IDS) {
        out[id] = {
          label: fill(base[id].label, seed[id].label),
          visible: base[id].visible,
        };
      }
      return out;
    })(),
    comingSoon: {
      enabled: Boolean(
        data.comingSoon?.enabled ?? d.comingSoon?.enabled ?? false
      ),
      title: fill(
        data.comingSoon?.title,
        d.comingSoon?.title ?? DEFAULT_COMING_SOON.title
      ),
    },
    featureVideos: (data.featureVideos ?? []).map((video, i) => {
      const seed = (d.featureVideos ?? [])[i];
      if (!seed) return video;
      return {
        ...video,
        title: fill(video.title, seed.title),
        description:
          video.description != null || seed.description != null
            ? fill(video.description, seed.description)
            : video.description,
      };
    }),
    social: {
      eyebrow: fill(
        data.social?.eyebrow,
        d.social?.eyebrow ?? DEFAULT_SOCIAL.eyebrow
      ),
      title: fill(data.social?.title, d.social?.title ?? DEFAULT_SOCIAL.title),
      description: fill(
        data.social?.description,
        d.social?.description ?? DEFAULT_SOCIAL.description
      ),
    },
    socialPosts: (data.socialPosts ?? []).map((p) => {
      const seed = (d.socialPosts ?? []).find((x) => x.id === p.id);
      if (!seed) return p;
      return {
        ...p,
        title: fill(p.title, seed.title),
        description: fill(p.description, seed.description),
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
    },
  };
}

export function savePortfolio(data: PortfolioData): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ ...data, version: DATA_VERSION });
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous && previous !== payload) {
      localStorage.setItem(STORAGE_BACKUP_KEY, previous);
    }
    localStorage.setItem(STORAGE_KEY, payload);
  } catch (e) {
    console.error("Impossible de sauvegarder (quota localStorage ?)", e);
    throw e;
  }
}

/** Download current portfolio JSON (for baking into defaults) */
export function downloadPortfolioSnapshot(data: PortfolioData): void {
  if (typeof window === "undefined") return;
  const payload = { ...data, version: DATA_VERSION };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-snapshot-v${DATA_VERSION}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
