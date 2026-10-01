import type { Locale } from "@/i18n/locales";
import { L, type LocalizedString } from "@/lib/i18n-content";

export type { Locale, LocalizedString };

/**
 * Content field that may be a legacy flat string or a per-locale map.
 * Always read with `getL()` / `l()` — write with `setL()`.
 */
export type Translatable = string | LocalizedString;

/** One editable badge above the Hero name */
export type HeroBadge = {
  id: string;
  text: Translatable;
  /** Background color (hex) */
  bgColor: string;
  /** Text color (hex) */
  textColor: string;
};

export type Profile = {
  /**
   * Display name — not multi-locale.
   * May contain limited rich HTML (bold, italic, size, color, align).
   * Always strip with stripHtml() for filenames / plain contexts.
   */
  name: string;
  /** May contain limited rich HTML */
  title: Translatable;
  /** May contain limited rich HTML (bold, italic, size, color, align) */
  bio: Translatable;
  photo: string | null;
  email: string;
  phone: string;
  location: Translatable;
  /** @deprecated prefer heroBadges — kept for migration */
  experienceBadge?: Translatable;
  /** Editable Hero badges (order = display). */
  heroBadges?: HeroBadge[];
  /**
   * CSS font-family for Hero texts only (web-safe stack or custom name).
   * Empty / undefined = site default (Geist).
   */
  heroFontFamily?: string;
  age?: number;
  showreelUrl: string;
  cvUrl: string | null;
};

/** Default hero experience badge (per locale) */
export const DEFAULT_EXPERIENCE_BADGE = L("20+ ans d’expérience", {
  en: "20+ years of experience",
  pl: "20+ lat doświadczenia",
  es: "Más de 20 años de experiencia",
});

/** Web-safe / system font choices for Hero only */
export const HERO_FONT_OPTIONS: { id: string; label: string; stack: string }[] =
  [
    {
      id: "default",
      label: "Défaut (Geist)",
      stack: "",
    },
    {
      id: "system",
      label: "Système",
      stack: "system-ui, -apple-system, Segoe UI, sans-serif",
    },
    {
      id: "georgia",
      label: "Georgia (serif)",
      stack: "Georgia, 'Times New Roman', Times, serif",
    },
    {
      id: "times",
      label: "Times New Roman",
      stack: "'Times New Roman', Times, serif",
    },
    {
      id: "arial",
      label: "Arial",
      stack: "Arial, Helvetica, sans-serif",
    },
    {
      id: "helvetica",
      label: "Helvetica",
      stack: "Helvetica, Arial, sans-serif",
    },
    {
      id: "verdana",
      label: "Verdana",
      stack: "Verdana, Geneva, sans-serif",
    },
    {
      id: "trebuchet",
      label: "Trebuchet MS",
      stack: "'Trebuchet MS', Helvetica, sans-serif",
    },
    {
      id: "courier",
      label: "Courier New (mono)",
      stack: "'Courier New', Courier, monospace",
    },
    {
      id: "palatino",
      label: "Palatino",
      stack: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
    },
  ];

export function resolveHeroFontStack(idOrStack?: string | null): string {
  if (!idOrStack?.trim()) return "";
  const found = HERO_FONT_OPTIONS.find(
    (f) => f.id === idOrStack || f.stack === idOrStack
  );
  if (found) return found.stack;
  return idOrStack.trim();
}

/** Shared media for experience / education carousels */
export type MediaItemType = "image" | "youtube" | "x" | "file";

export type MediaItem = {
  id: string;
  type: MediaItemType;
  /** Image/file Cloudinary URL or YouTube/X URL */
  url: string;
  caption?: Translatable;
};

export type Experience = {
  id: string;
  company: Translatable;
  role: Translatable;
  location?: Translatable;
  startDate: string;
  endDate: string | null;
  description: Translatable;
  /** Tool names — shared across locales */
  technologies?: string[];
  media: MediaItem[];
};

/** Cover media for project cards */
export type ProjectMediaType = "image" | "youtube" | "x";

export type Project = {
  id: string;
  title: Translatable;
  description: Translatable;
  longDescription?: Translatable;
  mediaType: ProjectMediaType;
  image: string | null;
  videoUrl: string | null;
  /** Tool / topic tags — shared across locales */
  tags: string[];
  link?: string;
  github?: string;
};

/** Icon badge on a skill detail card (emoji and/or uploaded image) */
export type SkillIcon = {
  id: string;
  emoji?: string;
  src?: string | null;
  label?: Translatable;
};

export type Skill = {
  id: string;
  name: Translatable;
  level?: number;
  category?: Translatable;
  /** Long-form explanation shown in the skill detail modal */
  description?: Translatable;
  /** Optional cover / illustrative photo (Cloudinary URL or remote) */
  image?: string | null;
  /** Decorative icons (emoji / uploads) */
  icons?: SkillIcon[];
};

export type Education = {
  id: string;
  year: string;
  degree: Translatable;
  school: Translatable;
  detail?: Translatable;
  media: MediaItem[];
};

export type LanguageVideoType = "none" | "file" | "youtube" | "x";

/** Built-in icon kinds (+ user upload) */
export type LanguageIconKind =
  | "flag"
  | "monument"
  | "culture"
  | "outline"
  | "upload";

/** One icon slot (cards can cycle several) */
export type LanguageIconItem = {
  id: string;
  kind: LanguageIconKind;
  /** ISO code for flag / outline / cultural presets */
  region?: string;
  /** Optional emoji for monument/culture presets */
  emoji?: string;
  /** Uploaded PNG/SVG/WebP (Cloudinary URL) */
  src?: string | null;
};

/** Country outline layer — built-in path or custom SVG */
export type LanguageOutline = {
  id: string;
  /** Built-in ISO code (when no custom SVG) */
  code?: string;
  label?: Translatable;
  /** Custom SVG markup or data URL uploaded by user */
  customSvg?: string | null;
  /** Stroke color (hex) — default amber/orange */
  color?: string;
};

/** Default outline stroke (design amber) */
export const DEFAULT_OUTLINE_COLOR = "#f59e0b";

/** @deprecated kept for migration */
export type LanguageIconStyle =
  | "flag"
  | "monument"
  | "culture"
  | "outline";

export type Language = {
  id: string;
  name: Translatable;
  level: Translatable;
  videoType: LanguageVideoType;
  videoUrl: string | null;
  /**
   * Still image shown while the demo video loads, or if it fails
   * (unsupported format / network error). Never leaves a black hole.
   */
  fallbackImageUrl?: string | null;
  /** Multiple icons — fade every 2s when > 1 */
  icons: LanguageIconItem[];
  /** Outlines drawn one-by-one full-bleed on the card */
  outlines: LanguageOutline[];
  /** Legacy fields (migrated into icons/outlines) */
  iconStyle?: LanguageIconStyle;
  primaryRegion?: string;
  regions?: string[];
};

export type UiPrefs = {
  overlayOpacity: number;
  showDock: boolean;
  /** Display locale for the portfolio (persisted) */
  locale?: Locale;
};

/**
 * Public “Coming Soon” landing (wallpaper + showreel + 3 feature cards).
 * Only affects visitors outside Mode Édition.
 */
export type ComingSoonConfig = {
  /** When true, public sees the Coming Soon page only */
  enabled: boolean;
  /** Optional headline (FR / EN / PL / ES) */
  title: Translatable;
};

export const DEFAULT_COMING_SOON: ComingSoonConfig = {
  /** Full site is public by default. */
  enabled: false,
  title: L("Coming soon", {
    en: "Coming soon",
    pl: "Wkrótce",
    es: "Próximamente",
  }),
};

/**
 * Site sections that can be shown/hidden for the public.
 * Includes nav destinations + Devis (quotes block).
 * Hrefs/anchors stay fixed when labels change.
 */
export type NavItemId =
  | "home"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "languages"
  | "quotes"
  | "contact"
  | "gallery";

export type NavItemConfig = {
  /** Display label (FR / EN / PL / ES) — used in menu when showInNav */
  label: Translatable;
  /**
   * When false: section hidden for the public AND removed from navigation.
   * Still reachable in Edit Mode (with a “Masquée” badge).
   */
  visible: boolean;
};

export type NavConfig = Record<NavItemId, NavItemConfig>;

export const NAV_ITEM_IDS: NavItemId[] = [
  "home",
  "experience",
  "projects",
  "skills",
  "education",
  "languages",
  "quotes",
  "contact",
  "gallery",
];

/** Fixed anchors / routes — independent of editable labels */
export type NavItemMeta = {
  id: NavItemId;
  href: string;
  /** DOM section id for scroll-spy; null for route-only pages */
  sectionId: string | null;
  /** i18n fallback key under `nav.*` */
  i18nKey: string;
  /**
   * When false, never listed in header/dock even if section is visible
   * (e.g. Devis block is on the page but not a top-level nav link by default).
   */
  showInNav?: boolean;
};

export const NAV_ITEM_META: NavItemMeta[] = [
  { id: "home", href: "/#hero", sectionId: "hero", i18nKey: "nav.home" },
  {
    id: "experience",
    href: "/#experience",
    sectionId: "experience",
    i18nKey: "nav.experience",
  },
  {
    id: "projects",
    href: "/#projects",
    sectionId: "projects",
    i18nKey: "nav.projects",
  },
  { id: "skills", href: "/#skills", sectionId: "skills", i18nKey: "nav.skills" },
  {
    id: "education",
    href: "/#education",
    sectionId: "education",
    i18nKey: "nav.education",
  },
  {
    id: "languages",
    href: "/#languages",
    sectionId: "languages",
    i18nKey: "nav.languages",
  },
  {
    id: "quotes",
    href: "/#devis",
    sectionId: "devis",
    i18nKey: "nav.quotes",
    showInNav: false,
  },
  {
    id: "contact",
    href: "/#contact",
    sectionId: "contact",
    i18nKey: "nav.contact",
  },
  {
    id: "gallery",
    href: "/projets",
    sectionId: null,
    i18nKey: "nav.gallery",
  },
];

export const DEFAULT_NAV: NavConfig = {
  home: {
    label: L("Accueil", {
      en: "Home",
      pl: "Start",
      es: "Inicio",
    }),
    visible: true,
  },
  experience: {
    label: L("Expériences", {
      en: "Experience",
      pl: "Doświadczenie",
      es: "Experiencia",
    }),
    visible: true,
  },
  projects: {
    label: L("Travaux", {
      en: "Work",
      pl: "Prace",
      es: "Trabajos",
    }),
    visible: true,
  },
  skills: {
    label: L("Compétences", {
      en: "Skills",
      pl: "Umiejętności",
      es: "Competencias",
    }),
    visible: true,
  },
  education: {
    label: L("Formation", {
      en: "Education",
      pl: "Edukacja",
      es: "Formación",
    }),
    visible: true,
  },
  languages: {
    label: L("Langues", {
      en: "Languages",
      pl: "Języki",
      es: "Idiomas",
    }),
    visible: true,
  },
  quotes: {
    label: L("Devis", {
      en: "Quotes",
      pl: "Wyceny",
      es: "Presupuestos",
    }),
    visible: true,
  },
  contact: {
    label: L("Contact", {
      en: "Contact",
      pl: "Kontakt",
      es: "Contacto",
    }),
    visible: true,
  },
  gallery: {
    label: L("Galerie", {
      en: "Gallery",
      pl: "Galeria",
      es: "Galería",
    }),
    visible: true,
  },
};

/** Icons available for Contact rapide widget lines */
export type QuickContactIcon =
  | "mail"
  | "phone"
  | "play"
  | "link"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "map"
  | "message"
  | "globe";

export type QuickContactLink = {
  id: string;
  icon: QuickContactIcon;
  /** Texte affiché (nom du bouton / libellé) */
  label: Translatable;
  /** Action : mailto:, tel:, https://… */
  href: string;
};

/**
 * Document téléchargeable / ouvrable (CV perso, portfolio PDF, carte HTML).
 * URL Cloudinary (raw) ou lien externe — ouverture toujours en nouvel onglet.
 */
export type ExtraDocument = {
  /** Cloudinary secure_url ou URL externe */
  url: string | null;
  /** Master : afficher le bouton (si URL renseignée) */
  show: boolean;
  /** Libellé du bouton */
  label: Translatable;
  /** Afficher dans le Hero */
  showInHero: boolean;
  /** Afficher dans la section Contact */
  showInContact: boolean;
};

export type ExtraDocumentId = "personalCv" | "portfolioPdf" | "businessCard";

export type ExtraDocumentsConfig = Record<ExtraDocumentId, ExtraDocument>;

/** Fully configurable Contact section + sidebar widgets + Hero CTA labels */
export type ContactConfig = {
  sectionEyebrow: Translatable;
  sectionTitle: Translatable;
  introText: Translatable;
  showNameTitle: boolean;
  showLocation: boolean;

  showEmail: boolean;
  /** Nom du bouton Email (ex. "M’écrire") */
  emailLabel: Translatable;
  /** Override profile.email if non-empty */
  emailValue: string;

  showPhone: boolean;
  /** Nom du bouton Téléphone (ex. "Appeler") */
  phoneLabel: Translatable;
  phoneValue: string;

  showShowreel: boolean;
  /** Nom du bouton Showreel contact */
  showreelLabel: Translatable;
  showreelUrl: string;

  showCopyEmail: boolean;
  /** Nom / texte du lien copier email (vide = affiche l’adresse) */
  copyEmailLabel: Translatable;

  showForm: boolean;
  formTitle: Translatable;
  /** Nom du bouton d’envoi du formulaire */
  formSubmitLabel: Translatable;

  /** —— Boutons Hero (profil) —— */
  showHeroShowreel: boolean;
  heroShowreelLabel: Translatable;
  showHeroCv: boolean;
  heroCvLabel: Translatable;
  showHeroPhone: boolean;
  /** Nom du lien téléphone hero (vide = affiche le numéro) */
  heroPhoneLabel: Translatable;
  showHeroEmail: boolean;
  /** Nom du lien email hero (vide = affiche l’adresse) */
  heroEmailLabel: Translatable;

  /**
   * Documents supplémentaires (en plus du CV généré par le site) :
   * CV PDF perso, portfolio PDF, carte de visite HTML.
   */
  extraDocuments: ExtraDocumentsConfig;

  showWidgetQuickContact: boolean;
  widgetQuickContactTitle: Translatable;
  /** Lignes du widget Contact rapide (ordre = affichage) */
  quickContactLinks: QuickContactLink[];

  showWidgetSkills: boolean;
  widgetSkillsTitle: Translatable;
  /** Tags affichés dans le widget Top skills */
  widgetSkillTags: string[];

  showWidgetAvailability: boolean;
  widgetAvailabilityTitle: Translatable;
  widgetAvailabilityText: Translatable;
};

/** Media type for main showreel + feature cards */
export type FeatureVideoType = "none" | "youtube" | "x" | "file";

export type FeatureVideo = {
  id: string;
  title: Translatable;
  /** Short line under the title on the 1:1 card */
  description?: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
  /**
   * Poster / still shown while video loads or if playback fails.
   * Prefer over black/empty frames.
   */
  fallbackImageUrl?: string | null;
};

/** Main showreel card (same options as feature cards) */
export type MainShowreel = {
  title: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
  /** Poster / still while loading or on video error */
  fallbackImageUrl?: string | null;
};

/** Editable small labels (eyebrows) + optional description per section */
export type SectionLabelsConfig = {
  experienceEyebrow: Translatable;
  projectsEyebrow: Translatable;
  skillsEyebrow: Translatable;
  educationEyebrow: Translatable;
  languagesEyebrow: Translatable;
  languagesDescription: Translatable;
};

/** @deprecated use SectionLabelsConfig.languagesDescription */
export type LanguagesSectionConfig = {
  description: Translatable;
};

/** Default opacity for per-wallpaper alpha video overlays (0–1) */
export const DEFAULT_ALPHA_VIDEO_OPACITY = 0.85;

/** One wallpaper image in the rotating background pool */
export type BackgroundImage = {
  id: string;
  /** Cloudinary secure_url or remote URL */
  url: string;
  /** Opacity of the base wallpaper image, 0–1 (default 1) */
  opacity?: number;
  /**
   * Optional transparent / alpha video overlay (WebM with alpha preferred, or MP4).
   * Plays looped + muted on top of this wallpaper image.
   */
  alphaVideoUrl?: string | null;
  /** Master toggle for the alpha video (needs alphaVideoUrl) */
  alphaVideoEnabled?: boolean;
  /** Opacity of the alpha video layer, 0–1 (default DEFAULT_ALPHA_VIDEO_OPACITY) */
  alphaVideoOpacity?: number;
};

/**
 * Professional quote-request services (not in main nav — only via CTA buttons).
 * Slug = URL segment under /devis/[slug]
 */
export type QuoteServiceId =
  | "montage"
  | "motion"
  | "social"
  | "captation"
  | "pack";

export type QuoteService = {
  id: QuoteServiceId;
  /** Show CTA button + allow page access */
  show: boolean;
  /** Label on the homepage CTA button */
  buttonLabel: Translatable;
  /** Page H1 */
  pageTitle: Translatable;
  /** Short professional intro under the title */
  pageIntro: Translatable;
};

export type QuotesConfig = {
  sectionEyebrow: Translatable;
  sectionTitle: Translatable;
  sectionDescription: Translatable;
  services: QuoteService[];
};

/**
 * One media candidate behind the Hero glass (image or alpha video).
 * Random pick among enabled items on each visit.
 */
export type HeroGlassBackMedia = {
  id: string;
  url: string;
  type: "video" | "image";
  /** Eligible for random selection on each visit */
  enabled: boolean;
  /** Layer opacity 0–1 (default 1) */
  opacity?: number;
  /**
   * When type is "video": still image if the video fails to load.
   * Ignored for type "image".
   */
  fallbackImageUrl?: string | null;
};

/** @deprecated Use HeroGlassBackMedia — kept as alias for older imports */
export type HeroGlassBackVideo = HeroGlassBackMedia;

/** Texture layer on top of glass (under text / profile photo) */
export type HeroGlassFrontLayer = {
  type: "none" | "video" | "image";
  url: string | null;
  /** 0–1 */
  opacity: number;
  /** When type is "video": still if the video fails to load */
  fallbackImageUrl?: string | null;
};

export type HeroGlassConfig = {
  /** Pool of back media (images + videos); storage key kept for compatibility */
  backVideos: HeroGlassBackMedia[];
  front: HeroGlassFrontLayer;
};

/** Attachment on a Médias / Social post (Vercel Blob) */
export type SocialPostFileKind = "pdf" | "image";
export type NotesCategory =
  | "Livre"
  | "Réflexions"
  | "Documents"
  | "Images"
  | "Vidéos";

/**
 * One post in the Notes universe (text + optional YouTube + optional file).
 * Distinct from Portfolio projects.
 */
export type SocialPost = {
  id: string;
  title: Translatable;
  description: Translatable;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Optional YouTube watch / share / Shorts URL */
  youtubeUrl: string | null;
  /** Optional PDF or image (Vercel Blob public URL) */
  fileUrl: string | null;
  fileKind: SocialPostFileKind | null;
  /** Original filename for download labels */
  fileName: string | null;
  /** Primary Notes category. */
  category?: NotesCategory;
  /** Free-form tags — shared across locales, used by search. */
  tags: string[];
  /** When false: hidden from the public, visible in Mode Édition */
  visible: boolean;
  /** Lower = higher in the list */
  order: number;
};

/** Editable headings for the Médias universe */
export type SocialConfig = {
  eyebrow: Translatable;
  title: Translatable;
  description: Translatable;
};

export const DEFAULT_SOCIAL: SocialConfig = {
  eyebrow: L("Journal", {
    en: "Journal",
    pl: "Dziennik",
    es: "Diario",
  }),
  title: L("Notes", {
    en: "Notes",
    pl: "Notatki",
    es: "Notas",
  }),
  description: L(
    "Livre, réflexions, documents, images et vidéos.",
    {
      en: "Book, reflections, documents, images and videos.",
      pl: "Książka, refleksje, dokumenty, obrazy i filmy.",
      es: "Libro, reflexiones, documentos, imágenes y vídeos.",
    }
  ),
};

export const DEFAULT_SOCIAL_POSTS: SocialPost[] = [];

export const DEFAULT_HERO_GLASS: HeroGlassConfig = {
  backVideos: [],
  front: {
    type: "none",
    url: null,
    opacity: 0.55,
    fallbackImageUrl: null,
  },
};

export type PortfolioData = {
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  education: Education[];
  languages: Language[];
  /** Editable section eyebrows (+ languages description) */
  sectionLabels: SectionLabelsConfig;
  /**
   * Editable navigation labels + visibility (header, dock, mobile).
   * Hrefs/anchors stay fixed via NAV_ITEM_META.
   */
  nav: NavConfig;
  /**
   * Coming Soon mode for public visitors (edit mode always sees full site).
   * Baked into production defaults via Export JSON / snapshot.
   */
  comingSoon: ComingSoonConfig;
  /**
   * Legacy languages section description (migrated into sectionLabels).
   * Kept optional for older localStorage payloads.
   */
  languagesSection?: LanguagesSectionConfig;
  contact: ContactConfig;
  /** Quote-request CTAs + dedicated /devis pages */
  quotes: QuotesConfig;
  /** Main showreel above the 3 feature cards */
  mainShowreel: MainShowreel;
  /** Three highlight videos under the showreel */
  featureVideos: FeatureVideo[];
  /**
   * Fallback / last-known background URL (kept for older code & export).
   * Prefer `backgroundImages` for the active pool.
   */
  backgroundUrl: string;
  /**
   * Pool of wallpapers. On each visit/reload a random image is shown.
   * Order is preserved for edit-mode management.
   */
  backgroundImages: BackgroundImage[];
  /**
   * Hero glass media layers (no procedural drops).
   * Back = behind glass card · Front = on glass, under text/photo.
   */
  heroGlass: HeroGlassConfig;
  ui: UiPrefs;
  /**
   * Médias / Social universe — posts with text, YouTube, PDF/image.
   * Completely separate from Portfolio projects.
   */
  social: SocialConfig;
  socialPosts: SocialPost[];
  version: number;
};

export const DATA_VERSION = 39;

export const QUOTE_SERVICE_IDS: QuoteServiceId[] = [
  "montage",
  "motion",
  "social",
  "captation",
  "pack",
];

export const DEFAULT_QUOTES: QuotesConfig = {
  sectionEyebrow: L("Travaillons ensemble", {
    en: "Let’s work together",
    pl: "Pracujmy razem",
    es: "Trabajemos juntos",
  }),
  sectionTitle: L("Demander un devis", {
    en: "Request a quote",
    pl: "Poproś o wycenę",
    es: "Solicitar un presupuesto",
  }),
  sectionDescription: L(
    "Choisissez le type de mission. Vous serez guidé vers un brief professionnel adapté.",
    {
      en: "Choose the type of project. You’ll get a professional brief tailored to that need.",
      pl: "Wybierz typ projektu. Otrzymasz profesjonalny brief dopasowany do potrzeby.",
      es: "Elige el tipo de proyecto. Te guiaremos con un brief profesional adaptado.",
    }
  ),
  services: [
    {
      id: "montage",
      show: true,
      buttonLabel: L("Devis Montage vidéo", {
        en: "Quote — Video editing",
        pl: "Wycena — Montaż wideo",
        es: "Presupuesto — Montaje de vídeo",
      }),
      pageTitle: L("Devis — Montage vidéo", {
        en: "Quote — Video editing",
        pl: "Wycena — Montaż wideo",
        es: "Presupuesto — Montaje de vídeo",
      }),
      pageIntro: L(
        "Montage narratif, rythmé et soigné pour films corporate, interviews, reportages ou contenus long-form. Précisez le volume, le style et la deadline pour un chiffrage précis.",
        {
          en: "Narrative, paced editing for corporate films, interviews, reportage or long-form content. Share volume, style and deadline for an accurate quote.",
          pl: "Narracyjny montaż do filmów corporate, wywiadów, reportaży i long-form. Podaj objętość, styl i deadline, aby wycenić dokładnie.",
          es: "Montaje narrativo y rítmico para corporate, entrevistas, reportajes o long-form. Indica volumen, estilo y deadline para un presupuesto preciso.",
        }
      ),
    },
    {
      id: "motion",
      show: true,
      buttonLabel: L("Devis Motion Design", {
        en: "Quote — Motion design",
        pl: "Wycena — Motion design",
        es: "Presupuesto — Motion design",
      }),
      pageTitle: L("Devis — Motion Design", {
        en: "Quote — Motion design",
        pl: "Wycena — Motion design",
        es: "Presupuesto — Motion design",
      }),
      pageIntro: L(
        "Habillages, lower-thirds, transitions, explainers et animations de marque. Indiquez le nombre de séquences, la charte graphique et les livrables attendus.",
        {
          en: "Packaging, lower-thirds, transitions, explainers and brand animation. Share sequence count, brand guidelines and expected deliverables.",
          pl: "Oprawy, lower-thirds, przejścia, explainery i animacje marki. Podaj liczbę sekwencji, brandbook i oczekiwane deliverables.",
          es: "Packs, lower-thirds, transiciones, explainers y animación de marca. Indica secuencias, brandbook y entregables.",
        }
      ),
    },
    {
      id: "social",
      show: true,
      buttonLabel: L("Devis Contenu Social / Shorts", {
        en: "Quote — Social / Shorts",
        pl: "Wycena — Social / Shorts",
        es: "Presupuesto — Social / Shorts",
      }),
      pageTitle: L("Devis — Contenu Social & Shorts", {
        en: "Quote — Social content & Shorts",
        pl: "Wycena — Social & Shorts",
        es: "Presupuesto — Social y Shorts",
      }),
      pageIntro: L(
        "Formats verticaux, reels, shorts et cut-downs optimisés pour les réseaux. Précisez le rythme de publication, le nombre de pièces et les plateformes cibles.",
        {
          en: "Vertical formats, reels, shorts and cut-downs for social. Share publish cadence, piece count and target platforms.",
          pl: "Formaty pionowe, reels, shorts i cut-downy pod social. Podaj rytm publikacji, liczbę materiałów i platformy.",
          es: "Formatos verticales, reels, shorts y cut-downs para redes. Indica cadencia, cantidad de piezas y plataformas.",
        }
      ),
    },
    {
      id: "captation",
      show: true,
      buttonLabel: L("Devis Captation & Corporate", {
        en: "Quote — Filming & corporate",
        pl: "Wycena — Captacja & corporate",
        es: "Presupuesto — Captación y corporate",
      }),
      pageTitle: L("Devis — Captation & Corporate", {
        en: "Quote — Filming & corporate",
        pl: "Wycena — Captacja & corporate",
        es: "Presupuesto — Captación y corporate",
      }),
      pageIntro: L(
        "Tournage / captation pour événements, interviews ou films d’entreprise, avec ou sans post-production. Indiquez le lieu, la durée de tournage et l’équipe souhaitée.",
        {
          en: "Filming for events, interviews or corporate films, with or without post. Share location, shoot duration and crew needs.",
          pl: "Zdjęcia eventowe, wywiady lub filmy firmowe, z postprodukcją lub bez. Podaj lokalizację, czas zdjęć i ekipę.",
          es: "Captación para eventos, entrevistas o corporate, con o sin post. Indica lugar, duración de rodaje y equipo.",
        }
      ),
    },
    {
      id: "pack",
      show: true,
      buttonLabel: L("Devis Pack complet", {
        en: "Quote — Full package",
        pl: "Wycena — Pakiet kompletny",
        es: "Presupuesto — Pack completo",
      }),
      pageTitle: L("Devis — Pack complet (montage + motion + social)", {
        en: "Quote — Full package (edit + motion + social)",
        pl: "Wycena — Pakiet (montaż + motion + social)",
        es: "Presupuesto — Pack (montaje + motion + social)",
      }),
      pageIntro: L(
        "Accompagnement de bout en bout : captation ou rushes, montage, motion et déclinaisons social. Idéal pour un lancement, une campagne ou une série de contenus.",
        {
          en: "End-to-end support: shoot or rushes, edit, motion and social cut-downs. Ideal for a launch, campaign or content series.",
          pl: "Wsparcie end-to-end: zdjęcia lub rushe, montaż, motion i social. Idealne na launch, kampanię lub serię treści.",
          es: "Acompañamiento integral: rodaje o rushes, montaje, motion y social. Ideal para lanzamiento, campaña o serie de contenidos.",
        }
      ),
    },
  ],
};

export const EXTRA_DOCUMENT_IDS: ExtraDocumentId[] = [
  "personalCv",
  "portfolioPdf",
  "businessCard",
];

export const DEFAULT_EXTRA_DOCUMENTS: ExtraDocumentsConfig = {
  personalCv: {
    url: null,
    show: false,
    label: L("CV PDF", {
      en: "CV PDF",
      pl: "CV PDF",
      es: "CV PDF",
    }),
    showInHero: true,
    showInContact: true,
  },
  portfolioPdf: {
    url: null,
    show: false,
    label: L("Portfolio PDF", {
      en: "Portfolio PDF",
      pl: "Portfolio PDF",
      es: "Portfolio PDF",
    }),
    showInHero: true,
    showInContact: true,
  },
  businessCard: {
    url: null,
    show: false,
    label: L("Carte de visite", {
      en: "Business card",
      pl: "Wizytówka",
      es: "Tarjeta de visita",
    }),
    showInHero: true,
    showInContact: true,
  },
};

export const DEFAULT_SECTION_LABELS: SectionLabelsConfig = {
  experienceEyebrow: L("Parcours", {
    en: "Career",
    pl: "Ścieżka",
    es: "Trayectoria",
  }),
  projectsEyebrow: L("Portfolio", {
    en: "Portfolio",
    pl: "Portfolio",
    es: "Portfolio",
  }),
  skillsEyebrow: L("Expertise", {
    en: "Expertise",
    pl: "Ekspertyza",
    es: "Experiencia",
  }),
  educationEyebrow: L("Études", {
    en: "Education",
    pl: "Edukacja",
    es: "Estudios",
  }),
  languagesEyebrow: L("International", {
    en: "International",
    pl: "Międzynarodowo",
    es: "Internacional",
  }),
  languagesDescription: L("Survolez une carte pour voir la démo vidéo", {
    en: "Hover a card to watch the video demo",
    pl: "Najedź na kartę, aby zobaczyć demo wideo",
    es: "Pasa el cursor sobre una tarjeta para ver el vídeo demo",
  }),
};

/** @deprecated use DEFAULT_SECTION_LABELS */
export const DEFAULT_LANGUAGES_SECTION: LanguagesSectionConfig = {
  description: DEFAULT_SECTION_LABELS.languagesDescription,
};

export const DEFAULT_MAIN_SHOWREEL: MainShowreel = {
  title: L("Showreel"),
  videoType: "youtube",
  videoUrl: "https://youtu.be/ws0EbZOxaNs",
  fallbackImageUrl: null,
};

export const DEFAULT_QUICK_CONTACT_LINKS: QuickContactLink[] = [
  {
    id: "qc-mail",
    icon: "mail",
    label: L("Email"),
    href: "mailto:patrick.roziel@me.com",
  },
  {
    id: "qc-showreel",
    icon: "play",
    label: L("Showreel"),
    href: "https://youtu.be/ws0EbZOxaNs",
  },
];

export const DEFAULT_WIDGET_SKILL_TAGS: string[] = [
  "Premiere Pro",
  "After Effects",
  "Motion design",
  "Social media",
  "Colorimétrie",
  "DaVinci Resolve",
];

/** Production defaults for the 3 feature video cards (Cloudinary + YouTube Shorts) */
export const DEFAULT_FEATURE_VIDEOS: FeatureVideo[] = [
  {
    id: "feat-1",
    title: L("Motion Design", {
      en: "Motion Design",
      pl: "Motion Design",
      es: "Motion Design",
    }),
    description: L("Habillages, lower-thirds et animations de marque.", {
      en: "Packaging, lower-thirds and brand animation.",
      pl: "Oprawy, lower-thirds i animacje marki.",
      es: "Packs, lower-thirds y animación de marca.",
    }),
    videoType: "file",
    videoUrl:
      "https://res.cloudinary.com/ptp8diwd/video/upload/v1784748535/pcqayn0d8gw7cmssuqmy.mov",
  },
  {
    id: "feat-2",
    title: L("Dynamic Short-Form", {
      en: "Dynamic Short-Form",
      pl: "Dynamic Short-Form",
      es: "Dynamic Short-Form",
    }),
    description: L("Reels, Shorts et formats verticaux rythmés.", {
      en: "Reels, Shorts and paced vertical formats.",
      pl: "Reels, Shorts i dynamiczne formaty pionowe.",
      es: "Reels, Shorts y formatos verticales con ritmo.",
    }),
    videoType: "file",
    videoUrl:
      "https://res.cloudinary.com/ptp8diwd/video/upload/v1785841588/patrick-roziel/showreel/ckcjdggyszoaeknsrm3c.mp4",
  },
  {
    id: "feat-3",
    title: L("AI-Enhanced Content", {
      en: "AI-Enhanced Content",
      pl: "AI-Enhanced Content",
      es: "AI-Enhanced Content",
    }),
    description: L("Génération, compositing et workflows assistés par l’IA.", {
      en: "Generation, compositing and AI-assisted workflows.",
      pl: "Generowanie, compositing i workflow wspierane przez AI.",
      es: "Generación, compositing y flujos asistidos por IA.",
    }),
    videoType: "file",
    videoUrl:
      "https://res.cloudinary.com/ptp8diwd/video/upload/v1785841914/patrick-roziel/showreel/gz0djttjwfj9hkffofxa.mov",
  },
];

export const DEFAULT_CONTACT: ContactConfig = {
  sectionEyebrow: L("Restons en contact", {
    en: "Let’s connect",
    pl: "Bądźmy w kontakcie",
    es: "Sigamos en contacto",
  }),
  sectionTitle: L("Contact"),
  introText: L(
    "Disponible pour missions montage, motion et communication digitale.",
    {
      en: "Available for editing, motion and digital communications missions.",
      pl: "Dostępny do projektów montażu, motion i komunikacji cyfrowej.",
      es: "Disponible para misiones de montaje, motion y comunicación digital.",
    }
  ),
  showNameTitle: true,
  showLocation: true,

  showEmail: true,
  emailLabel: L("Email"),
  emailValue: "",

  showPhone: false,
  phoneLabel: L(""),
  phoneValue: "",

  showShowreel: true,
  showreelLabel: L("Showreel"),
  showreelUrl: "",

  showCopyEmail: true,
  copyEmailLabel: L(""),

  showForm: true,
  formTitle: L("Message rapide (ouvre votre client mail) :", {
    en: "Quick message (opens your mail client):",
    pl: "Szybka wiadomość (otwiera klienta mail):",
    es: "Mensaje rápido (abre tu cliente de correo):",
  }),
  formSubmitLabel: L("Envoyer via mail", {
    en: "Send via email",
    pl: "Wyślij mailem",
    es: "Enviar por correo",
  }),

  showHeroShowreel: true,
  heroShowreelLabel: L("Voir le showreel", {
    en: "Watch showreel",
    pl: "Zobacz showreel",
    es: "Ver showreel",
  }),
  showHeroCv: true,
  heroCvLabel: L("Télécharger CV", {
    en: "Download CV",
    pl: "Pobierz CV",
    es: "Descargar CV",
  }),
  showHeroPhone: false,
  heroPhoneLabel: L(""),
  showHeroEmail: true,
  heroEmailLabel: L(""),

  extraDocuments: {
    personalCv: { ...DEFAULT_EXTRA_DOCUMENTS.personalCv },
    portfolioPdf: { ...DEFAULT_EXTRA_DOCUMENTS.portfolioPdf },
    businessCard: { ...DEFAULT_EXTRA_DOCUMENTS.businessCard },
  },

  showWidgetQuickContact: true,
  widgetQuickContactTitle: L("Contact rapide", {
    en: "Quick contact",
    pl: "Szybki kontakt",
    es: "Contacto rápido",
  }),
  quickContactLinks: DEFAULT_QUICK_CONTACT_LINKS.map((l) => ({ ...l })),
  showWidgetSkills: true,
  widgetSkillsTitle: L("Top skills"),
  widgetSkillTags: [...DEFAULT_WIDGET_SKILL_TAGS],
  showWidgetAvailability: true,
  widgetAvailabilityTitle: L("Disponibilité", {
    en: "Availability",
    pl: "Dostępność",
    es: "Disponibilidad",
  }),
  widgetAvailabilityText: L("Ouvert aux missions", {
    en: "Open to missions",
    pl: "Otwarty na projekty",
    es: "Abierto a misiones",
  }),
};
