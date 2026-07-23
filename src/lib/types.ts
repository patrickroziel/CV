import type { Locale } from "@/i18n/locales";
import { L, type LocalizedString } from "@/lib/i18n-content";

export type { Locale, LocalizedString };

/**
 * Content field that may be a legacy flat string or a per-locale map.
 * Always read with `getL()` / `l()` — write with `setL()`.
 */
export type Translatable = string | LocalizedString;

export type Profile = {
  /** Proper name — not localized */
  name: string;
  title: Translatable;
  bio: Translatable;
  photo: string | null;
  email: string;
  phone: string;
  location: Translatable;
  age?: number;
  showreelUrl: string;
  cvUrl: string | null;
};

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

  /** Bouton X (Twitter) dans le Hero */
  showHeroX: boolean;
  heroXLabel: Translatable;
  /** Profil X : https://x.com/username ou @username */
  xProfileUrl: string;

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

  /** Feed X (Twitter) dans la sidebar */
  showWidgetXFeed: boolean;
  widgetXFeedTitle: Translatable;
  /** @username sans @ (ou extrait de xProfileUrl) */
  xUsername: string;
};

/** Media type for main showreel + feature cards */
export type FeatureVideoType = "none" | "youtube" | "x" | "file";

export type FeatureVideo = {
  id: string;
  title: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
};

/** Main showreel card (same options as feature cards) */
export type MainShowreel = {
  title: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
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
   * Legacy languages section description (migrated into sectionLabels).
   * Kept optional for older localStorage payloads.
   */
  languagesSection?: LanguagesSectionConfig;
  contact: ContactConfig;
  /** Main showreel above the 3 feature cards */
  mainShowreel: MainShowreel;
  /** Three highlight videos under the showreel */
  featureVideos: FeatureVideo[];
  backgroundUrl: string;
  ui: UiPrefs;
  version: number;
};

export const DATA_VERSION = 20;

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
};

export const DEFAULT_QUICK_CONTACT_LINKS: QuickContactLink[] = [
  {
    id: "qc-mail",
    icon: "mail",
    label: L("Email"),
    href: "mailto:patrick.roziel@me.com",
  },
  {
    id: "qc-phone",
    icon: "phone",
    label: L("07 44 40 97 90"),
    href: "tel:0744409790",
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
    title: L("Timelapse"),
    videoType: "file",
    videoUrl:
      "https://res.cloudinary.com/ptp8diwd/video/upload/v1784743251/fpydktqqqq4d7ibymdsu.mov",
  },
  {
    id: "feat-2",
    title: L("Motion Design"),
    videoType: "file",
    videoUrl:
      "https://res.cloudinary.com/ptp8diwd/video/upload/v1784748535/pcqayn0d8gw7cmssuqmy.mov",
  },
  {
    id: "feat-3",
    title: L("AI + Sources"),
    videoType: "youtube",
    videoUrl: "https://youtube.com/shorts/dHWIxpPRmmM",
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

  showPhone: true,
  phoneLabel: L("Appeler", {
    en: "Call",
    pl: "Zadzwoń",
    es: "Llamar",
  }),
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
  showHeroPhone: true,
  heroPhoneLabel: L(""),
  showHeroEmail: true,
  heroEmailLabel: L(""),

  showHeroX: true,
  heroXLabel: L("X / Twitter"),
  xProfileUrl: "https://x.com/",

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

  showWidgetXFeed: true,
  widgetXFeedTitle: L("Sur X", {
    en: "On X",
    pl: "Na X",
    es: "En X",
  }),
  xUsername: "@patrickroziel",
};
