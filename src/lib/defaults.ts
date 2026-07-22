import type { PortfolioData } from "./types";
import {
  DATA_VERSION,
  DEFAULT_CONTACT,
  DEFAULT_FEATURE_VIDEOS,
  DEFAULT_MAIN_SHOWREEL,
  DEFAULT_SECTION_LABELS,
} from "./types";
import { L } from "./i18n-content";

/** Dark green aerial forest canopy — Unsplash */
export const DEFAULT_BACKGROUND =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=80";

function projectPlaceholder(title: string, from: string, to: string): string {
  const initial = title.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${from}"/>
      <stop offset="100%" style="stop-color:${to}"/>
    </linearGradient></defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="rgba(255,255,255,0.2)">${initial}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function avatarPlaceholder(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2dd4bf"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient></defs>
    <rect width="400" height="400" fill="url(#a)"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui,sans-serif" font-size="140" font-weight="600" fill="white">${initials}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const DEFAULT_PORTFOLIO: PortfolioData = {
  version: DATA_VERSION,
  backgroundUrl: DEFAULT_BACKGROUND,
  ui: {
    overlayOpacity: 0.52,
    showDock: true,
    locale: "fr",
  },
  profile: {
    name: "Patrick Roziel",
    title: L(
      "Monteur vidéo | Motion designer | Chargé de communication digitale",
      {
        en: "Video editor | Motion designer | Digital communications specialist",
        pl: "Montażysta wideo | Motion designer | Specjalista ds. komunikacji cyfrowej",
        es: "Editor de vídeo | Motion designer | Especialista en comunicación digital",
      }
    ),
    bio: L(
      "Monteur vidéo et spécialiste en communication digitale avec plus de 10 ans d’expérience en production vidéo, motion design et contenus de marque. Expertise en formats réseaux sociaux, vidéos corporate et workflows à délais courts.",
      {
        en: "Video editor and digital communications specialist with over 10 years of experience in video production, motion design and brand content. Expert in social formats, corporate films and fast-turnaround workflows.",
        pl: "Montażysta wideo i specjalista ds. komunikacji cyfrowej z ponad 10-letnim doświadczeniem w produkcji wideo, motion designie i treściach marki. Ekspert od formatów social, filmów corporate i szybkich workflowów.",
        es: "Editor de vídeo y especialista en comunicación digital con más de 10 años de experiencia en producción audiovisual, motion design y contenidos de marca. Experto en formatos sociales, vídeos corporativos y flujos de trabajo ágiles.",
      }
    ),
    photo: avatarPlaceholder("Patrick Roziel"),
    email: "patrick.roziel@me.com",
    phone: "07 44 40 97 90",
    location: L("La Courneuve (93), France", {
      en: "La Courneuve (93), France",
      pl: "La Courneuve (93), Francja",
      es: "La Courneuve (93), Francia",
    }),
    showreelUrl: "https://youtu.be/ws0EbZOxaNs",
    cvUrl: null,
  },
  experiences: [
    {
      id: "exp-sav",
      company: L("SAV"),
      role: L("Technicien audiovisuel", {
        en: "Audiovisual technician",
        pl: "Technik audiowizualny",
        es: "Técnico audiovisual",
      }),
      location: L("Saint-Denis"),
      startDate: "2024-09",
      endDate: "2025-02",
      description: L(
        "Gestion de stock matériel audiovisuel, préparation de commandes et optimisation de l’atelier (−30 % de temps de préparation). Création d’une vidéo récapitulative pour documenter les process.",
        {
          en: "AV equipment stock management, order prep and workshop optimization (−30% prep time). Created a summary video to document processes.",
          pl: "Zarządzanie magazynem sprzętu AV, przygotowanie zamówień i optymalizacja warsztatu (−30% czasu przygotowania). Film podsumowujący procesy.",
          es: "Gestión de stock de material AV, preparación de pedidos y optimización del taller (−30% de tiempo de prep.). Vídeo resumen de los procesos.",
        }
      ),
      technologies: ["Audiovisuel", "Logistique", "Vidéo"],
      media: [],
    },
    {
      id: "exp-prompteur",
      company: L("Solutions Prompteur"),
      role: L("Monteur vidéo / Opérateur prompteur", {
        en: "Video editor / Teleprompter operator",
        pl: "Montażysta wideo / Operator promptera",
        es: "Editor de vídeo / Operador de teleprompter",
      }),
      location: L("Île-de-France", {
        en: "Île-de-France",
        pl: "Île-de-France",
        es: "Isla de Francia",
      }),
      startDate: "2023",
      endDate: "2024",
      description: L(
        "Montage vidéo, création graphique et opération de prompteur pour des productions événementielles et corporate.",
        {
          en: "Video editing, graphic creation and teleprompter operation for live and corporate productions.",
          pl: "Montaż wideo, grafika i obsługa promptera na produkcjach eventowych i corporate.",
          es: "Edición de vídeo, creación gráfica y operación de teleprompter para eventos y corporate.",
        }
      ),
      technologies: ["Premiere Pro", "After Effects", "Prompteur", "Graphisme"],
      media: [],
    },
    {
      id: "exp-dietplus-2022",
      company: L("Dietplus"),
      role: L("Réalisateur / Monteur vidéo freelance", {
        en: "Director / Freelance video editor",
        pl: "Reżyser / Freelancer montażysta wideo",
        es: "Realizador / Editor de vídeo freelance",
      }),
      location: L("France", {
        en: "France",
        pl: "Francja",
        es: "Francia",
      }),
      startDate: "2022",
      endDate: "2022",
      description: L(
        "Captation Steadicam, interviews et montage pour des contenus de marque nutrition / bien-être.",
        {
          en: "Steadicam capture, interviews and editing for nutrition / wellness brand content.",
          pl: "Zdjęcia Steadicam, wywiady i montaż dla marki nutrition / wellness.",
          es: "Captación con Steadicam, entrevistas y montaje para marca de nutrición / bienestar.",
        }
      ),
      technologies: ["Steadicam", "Réalisation", "Montage", "Interview"],
      media: [],
    },
    {
      id: "exp-jellysmack",
      company: L("Jellysmack"),
      role: L("Monteur vidéo", {
        en: "Video editor",
        pl: "Montażysta wideo",
        es: "Editor de vídeo",
      }),
      location: L("Paris"),
      startDate: "2022",
      endDate: "2022",
      description: L(
        "Montage de contenus pour créateurs et influenceurs : rythme social, hooks, formats verticaux et horizontaux (Facebook, Shorts).",
        {
          en: "Editing for creators and influencers: social pacing, hooks, vertical and horizontal formats (Facebook, Shorts).",
          pl: "Montaż dla twórców i influencerów: tempo social, hooki, formaty pionowe i poziome (Facebook, Shorts).",
          es: "Edición para creadores e influencers: ritmo social, hooks, formatos verticales y horizontales (Facebook, Shorts).",
        }
      ),
      technologies: ["Premiere Pro", "Social Media", "Facebook", "YouTube"],
      media: [],
    },
    {
      id: "exp-sputnik",
      company: L("Sputnik France"),
      role: L("Monteur vidéo / Graphiste", {
        en: "Video editor / Graphic designer",
        pl: "Montażysta wideo / Grafik",
        es: "Editor de vídeo / Diseñador gráfico",
      }),
      location: L("Paris"),
      startDate: "2021",
      endDate: "2022",
      description: L(
        "Montage d’actualités et de reportages, habillage graphique et motion pour un média d’information.",
        {
          en: "News and reportage editing, graphic packaging and motion for a news media outlet.",
          pl: "Montaż newsów i reportaży, oprawa graficzna i motion dla medium informacyjnego.",
          es: "Montaje de noticias y reportajes, packaging gráfico y motion para un medio de información.",
        }
      ),
      technologies: ["Premiere Pro", "After Effects", "News", "Motion"],
      media: [],
    },
    {
      id: "exp-dietplus-2018",
      company: L("Dietplus"),
      role: L("Monteur vidéo", {
        en: "Video editor",
        pl: "Montażysta wideo",
        es: "Editor de vídeo",
      }),
      location: L("France", {
        en: "France",
        pl: "Francja",
        es: "Francia",
      }),
      startDate: "2018",
      endDate: "2019",
      description: L(
        "Production vidéo et supports graphiques pour la communication de marque.",
        {
          en: "Video production and graphic assets for brand communication.",
          pl: "Produkcja wideo i materiały graficzne do komunikacji marki.",
          es: "Producción de vídeo y soportes gráficos para la comunicación de marca.",
        }
      ),
      technologies: ["Montage", "Photoshop", "Illustrator"],
      media: [],
    },
  ],
  projects: [
    {
      id: "proj-showreel",
      title: L("Showreel 2024"),
      description: L(
        "Sélection de montages, motions et captations — rythme, couleur et storytelling.",
        {
          en: "A selection of edits, motions and captures — pacing, color and storytelling.",
          pl: "Wybór montaży, motionów i zdjęć — rytm, kolor i storytelling.",
          es: "Selección de montajes, motions y captaciones — ritmo, color y storytelling.",
        }
      ),
      longDescription: L(
        "Showreel personnel regroupant des extraits de montage corporate, social, motion design et captation. Idéal pour découvrir mon style et mon niveau technique en quelques minutes.",
        {
          en: "Personal showreel with corporate, social, motion design and capture excerpts. Ideal to discover my style and technical level in a few minutes.",
          pl: "Osobisty showreel z fragmentami montażu corporate, social, motion design i captacji. Idealny, by poznać mój styl w kilka minut.",
          es: "Showreel personal con extractos de montaje corporate, social, motion design y captación. Ideal para descubrir mi estilo en pocos minutos.",
        }
      ),
      mediaType: "youtube",
      image: projectPlaceholder("Showreel", "#0f766e", "#134e4a"),
      videoUrl: "https://youtu.be/ws0EbZOxaNs",
      tags: ["Montage", "Showreel", "Premiere Pro", "After Effects"],
      link: "https://youtu.be/ws0EbZOxaNs",
    },
    {
      id: "proj-motion",
      title: L("Motion Brand Package"),
      description: L(
        "Pack d’animations pour intro, lower-thirds et transitions de marque.",
        {
          en: "Animation pack for intros, lower-thirds and brand transitions.",
          pl: "Pakiet animacji: intro, lower-thirds i przejścia marki.",
          es: "Pack de animaciones para intro, lower-thirds y transiciones de marca.",
        }
      ),
      longDescription: L(
        "Kit motion design réutilisable : intros, bas de page animés, transitions et end-cards. Expressions After Effects et templates MOGRT pour Premiere.",
        {
          en: "Reusable motion design kit: intros, animated lower-thirds, transitions and end-cards. After Effects expressions and MOGRT templates for Premiere.",
          pl: "Zestaw motion design do ponownego użycia: intro, dolne paski, przejścia i end-cards. Expressions AE i szablony MOGRT.",
          es: "Kit de motion reutilizable: intros, lower-thirds, transiciones y end-cards. Expresiones de AE y plantillas MOGRT para Premiere.",
        }
      ),
      mediaType: "image",
      image: projectPlaceholder("Motion", "#115e59", "#042f2e"),
      videoUrl: null,
      tags: ["After Effects", "Motion Design", "MOGRT", "Branding"],
    },
    {
      id: "proj-social",
      title: L("Social Cuts Influenceurs", {
        en: "Influencer Social Cuts",
        pl: "Social Cuts dla influencerów",
        es: "Cortes social para influencers",
      }),
      description: L(
        "Formats courts dynamiques pour YouTube, Instagram, Facebook et Shorts.",
        {
          en: "Dynamic short-form edits for YouTube, Instagram, Facebook and Shorts.",
          pl: "Dynamiczne krótkie formaty na YouTube, Instagram, Facebook i Shorts.",
          es: "Formatos cortos dinámicos para YouTube, Instagram, Facebook y Shorts.",
        }
      ),
      longDescription: L(
        "Séries de montages courts optimisés pour l’attention mobile : hooks, sous-titres, punchlines et rythme serré.",
        {
          en: "Short-form series optimized for mobile attention: hooks, captions, punchlines and tight pacing.",
          pl: "Serie krótkich montaży pod mobile: hooki, napisy, punchline’y i szybkie tempo.",
          es: "Series de montajes cortos optimizados para móvil: hooks, subtítulos, punchlines y ritmo cerrado.",
        }
      ),
      mediaType: "image",
      image: projectPlaceholder("Social", "#b45309", "#451a03"),
      videoUrl: null,
      tags: ["Social Media", "Montage", "Shorts", "Vertical"],
    },
    {
      id: "proj-corporate",
      title: L("Captation & Interview Corporate", {
        en: "Corporate Capture & Interviews",
        pl: "Captacja i wywiady corporate",
        es: "Captación y entrevistas corporate",
      }),
      description: L(
        "Tournage Steadicam, interviews et post-production pour la marque.",
        {
          en: "Steadicam shooting, interviews and post-production for the brand.",
          pl: "Zdjęcia Steadicam, wywiady i postprodukcja dla marki.",
          es: "Rodaje con Steadicam, entrevistas y postproducción para la marca.",
        }
      ),
      longDescription: L(
        "De la captation (Steadicam, lumière, son) au montage final : interviews, plans de coupe et étalonnage pour un rendu premium.",
        {
          en: "From capture (Steadicam, light, sound) to final edit: interviews, B-roll and grading for a premium look.",
          pl: "Od zdjęć (Steadicam, światło, dźwięk) do finalnego montażu: wywiady, plany i color grading premium.",
          es: "De la captación (Steadicam, luz, sonido) al montaje final: entrevistas, planos de corte y etalonaje premium.",
        }
      ),
      mediaType: "image",
      image: projectPlaceholder("Corporate", "#292524", "#0c0a09"),
      videoUrl: null,
      tags: ["Steadicam", "Interview", "Réalisation", "Colorimétrie"],
    },
  ],
  skills: [
    {
      id: "sk-premiere",
      name: L("Adobe Premiere Pro"),
      level: 95,
      category: L("Montage vidéo", {
        en: "Video editing",
        pl: "Montaż wideo",
        es: "Montaje de vídeo",
      }),
      description: L(
        "Montage multi-caméras, storytelling rythmé, workflows proxy et livraison broadcast / social. Maîtrise des timelines complexes, de l’audio mix et des exports optimisés.",
        {
          en: "Multi-cam editing, paced storytelling, proxy workflows and broadcast/social delivery. Complex timelines, audio mix and optimized exports.",
          pl: "Montaż multi-cam, storytelling, workflow proxy i dostawy broadcast/social. Złożone timeline’y, mix audio i eksporty.",
          es: "Montaje multi-cámara, storytelling rítmico, workflows proxy y entrega broadcast/social. Timelines complejas, mezcla de audio y exports.",
        }
      ),
      icons: [
        { id: "i1", emoji: "🎬", label: L("Montage", { en: "Edit", pl: "Montaż", es: "Montaje" }) },
        { id: "i2", emoji: "✂️", label: L("Cut") },
      ],
    },
    {
      id: "sk-fcp",
      name: L("Final Cut Pro"),
      level: 85,
      category: L("Montage vidéo", {
        en: "Video editing",
        pl: "Montaż wideo",
        es: "Montaje de vídeo",
      }),
      description: L(
        "Montage magnétique rapide, étalonnage intégré et livraisons multi-formats sur écosystème Apple.",
        {
          en: "Fast magnetic timeline editing, built-in grading and multi-format delivery on Apple ecosystem.",
          pl: "Szybki montaż magnetyczny, grading wbudowany i dostawy multi-format w ekosystemie Apple.",
          es: "Montaje magnético rápido, etalonaje integrado y entregas multi-formato en ecosistema Apple.",
        }
      ),
      icons: [{ id: "i1", emoji: "🍎", label: L("Apple") }],
    },
    {
      id: "sk-resolve",
      name: L("DaVinci Resolve"),
      level: 82,
      category: L("Montage vidéo", {
        en: "Video editing",
        pl: "Montaż wideo",
        es: "Montaje de vídeo",
      }),
      description: L(
        "Color grading avancé, nodes, looks cinéma et finishing pour films corporate et clips.",
        {
          en: "Advanced color grading, nodes, cinematic looks and finishing for corporate films and clips.",
          pl: "Zaawansowany color grading, nodes, looki filmowe i finishing dla corporate i klipów.",
          es: "Etalonaje avanzado, nodos, looks cine y finishing para films corporate y clips.",
        }
      ),
      icons: [
        { id: "i1", emoji: "🎨", label: L("Color") },
        { id: "i2", emoji: "🎞️", label: L("Film") },
      ],
    },
    {
      id: "sk-ae",
      name: L("Adobe After Effects"),
      level: 92,
      category: L("Motion design", {
        en: "Motion design",
        pl: "Motion design",
        es: "Motion design",
      }),
      description: L(
        "Motion design, habillage, lower-thirds, animations 2D et intégration de templates dynamiques.",
        {
          en: "Motion design, packaging, lower-thirds, 2D animation and dynamic template integration.",
          pl: "Motion design, oprawa, lower-thirds, animacja 2D i dynamiczne szablony.",
          es: "Motion design, packaging, lower-thirds, animación 2D e integración de plantillas dinámicas.",
        }
      ),
      icons: [
        { id: "i1", emoji: "✨", label: L("Motion") },
        { id: "i2", emoji: "🌀", label: L("FX") },
      ],
    },
    {
      id: "sk-motion",
      name: L("Apple Motion"),
      level: 80,
      category: L("Motion design"),
      description: L(
        "Templates Motion / FCP, titres animés et graphiques temps réel pour broadcasts légers.",
        {
          en: "Motion / FCP templates, animated titles and real-time graphics for light broadcast.",
          pl: "Szablony Motion / FCP, animowane tytuły i grafika real-time.",
          es: "Plantillas Motion / FCP, títulos animados y gráficos en tiempo real.",
        }
      ),
      icons: [{ id: "i1", emoji: "⚡", label: L("Templates") }],
    },
    {
      id: "sk-mogrt",
      name: L("Templates MOGRT"),
      level: 88,
      category: L("Motion design"),
      description: L(
        "Création et adaptation de Motion Graphics Templates pour Premiere, réutilisables en série.",
        {
          en: "Creating and adapting Motion Graphics Templates for Premiere, reusable at scale.",
          pl: "Tworzenie i adaptacja szablonów MOGRT do Premiere, wielokrotnego użytku.",
          es: "Creación y adaptación de plantillas MOGRT para Premiere, reutilizables en serie.",
        }
      ),
      icons: [{ id: "i1", emoji: "📦", label: L("MOGRT") }],
    },
    {
      id: "sk-yt",
      name: L("YouTube / Shorts"),
      level: 90,
      category: L("Vidéo réseaux sociaux", {
        en: "Social video",
        pl: "Wideo w social media",
        es: "Vídeo redes sociales",
      }),
      description: L(
        "Formats verticaux et horizontaux, hooks, pacing algorithmique et miniatures cohérentes.",
        {
          en: "Vertical and horizontal formats, hooks, algorithm-friendly pacing and consistent thumbnails.",
          pl: "Formaty pionowe i poziome, hooki, pacing pod algorytm i spójne miniatury.",
          es: "Formatos verticales y horizontales, hooks, pacing algorítmico y miniaturas coherentes.",
        }
      ),
      icons: [
        { id: "i1", emoji: "▶️", label: L("YouTube") },
        { id: "i2", emoji: "📱", label: L("Shorts") },
      ],
    },
    {
      id: "sk-ig",
      name: L("Instagram / Reels"),
      level: 88,
      category: L("Vidéo réseaux sociaux", {
        en: "Social video",
        pl: "Wideo w social media",
        es: "Vídeo redes sociales",
      }),
      description: L(
        "Reels engageants, cuts au beat, overlays et finitions adaptées au feed Instagram.",
        {
          en: "Engaging Reels, beat cuts, overlays and finishes tailored for Instagram feed.",
          pl: "Angażujące Reels, cięcia do beatu, overlaye i finisz pod Instagram.",
          es: "Reels atractivos, cortes al beat, overlays y acabados para el feed de Instagram.",
        }
      ),
      icons: [{ id: "i1", emoji: "📸", label: L("IG") }],
    },
    {
      id: "sk-fb",
      name: L("Facebook / formats social", {
        en: "Facebook / social formats",
        pl: "Facebook / formaty social",
        es: "Facebook / formatos social",
      }),
      level: 90,
      category: L("Vidéo réseaux sociaux", {
        en: "Social video",
        pl: "Wideo w social media",
        es: "Vídeo redes sociales",
      }),
      description: L(
        "Formats ads et organiques Facebook, ratios multiples et messages clairs dès les premières secondes.",
        {
          en: "Facebook ads and organic formats, multiple ratios and clear messages from the first seconds.",
          pl: "Formaty ads i organiczne na Facebooku, wiele ratio i jasny przekaz od pierwszych sekund.",
          es: "Formatos ads y orgánicos de Facebook, múltiples ratios y mensajes claros desde el primer segundo.",
        }
      ),
      icons: [{ id: "i1", emoji: "👍", label: L("Social") }],
    },
    {
      id: "sk-ps",
      name: L("Photoshop"),
      level: 90,
      category: L("Graphisme", {
        en: "Graphic design",
        pl: "Grafika",
        es: "Diseño gráfico",
      }),
      description: L(
        "Retouche photo, miniatures, assets UI et compositions pour supports print & digital.",
        {
          en: "Photo retouching, thumbnails, UI assets and compositions for print & digital.",
          pl: "Retusz zdjęć, miniatury, assety UI i kompozycje print & digital.",
          es: "Retoque foto, miniaturas, assets UI y composiciones para print y digital.",
        }
      ),
      icons: [{ id: "i1", emoji: "🖼️", label: L("Photo") }],
    },
    {
      id: "sk-ai",
      name: L("Illustrator"),
      level: 88,
      category: L("Graphisme", {
        en: "Graphic design",
        pl: "Grafika",
        es: "Diseño gráfico",
      }),
      description: L(
        "Logos, pictos, vectoriel et déclinaisons de charte pour motion et print.",
        {
          en: "Logos, icons, vector art and brand system assets for motion and print.",
          pl: "Loga, piktogramy, wektory i system identyfikacji do motion i printu.",
          es: "Logos, pictos, vectorial y declinaciones de marca para motion y print.",
        }
      ),
      icons: [{ id: "i1", emoji: "✏️", label: L("Vector") }],
    },
    {
      id: "sk-id",
      name: L("InDesign"),
      level: 82,
      category: L("Graphisme", {
        en: "Graphic design",
        pl: "Grafika",
        es: "Diseño gráfico",
      }),
      description: L(
        "Mises en page éditoriales, dossiers de presse et supports print multi-pages.",
        {
          en: "Editorial layouts, press kits and multi-page print materials.",
          pl: "Skład edytorski, press kitty i materiały print multi-page.",
          es: "Maquetación editorial, dossiers de prensa y soportes print multipágina.",
        }
      ),
      icons: [{ id: "i1", emoji: "📄", label: L("Print") }],
    },
    {
      id: "sk-color",
      name: L("Colorimétrie", {
        en: "Color grading",
        pl: "Kolorystyka",
        es: "Etalonaje",
      }),
      level: 85,
      category: L("Autres", {
        en: "Other",
        pl: "Inne",
        es: "Otros",
      }),
      description: L(
        "Looks cohérents de projet, matching multi-cam et finitions cinema / corporate.",
        {
          en: "Consistent project looks, multi-cam matching and cinema / corporate finishing.",
          pl: "Spójne looki projektu, matching multi-cam i finishing cinema / corporate.",
          es: "Looks coherentes de proyecto, matching multi-cam y finishing cine / corporate.",
        }
      ),
      icons: [{ id: "i1", emoji: "🌈", label: L("Grade") }],
    },
    {
      id: "sk-prompter",
      name: L("Prompteur", {
        en: "Teleprompter",
        pl: "Prompter",
        es: "Teleprompter",
      }),
      level: 88,
      category: L("Autres", {
        en: "Other",
        pl: "Inne",
        es: "Otros",
      }),
      description: L(
        "Gestion prompteur en plateau, rythme de lecture et confort interlocuteur.",
        {
          en: "On-set teleprompter operation, reading pace and talent comfort.",
          pl: "Obsługa promptera na planie, tempo czytania i komfort mówcy.",
          es: "Operación de teleprompter en plató, ritmo de lectura y comodidad del interlocutor.",
        }
      ),
      icons: [{ id: "i1", emoji: "📜", label: L("Prompt") }],
    },
    {
      id: "sk-multi",
      name: L("Production multilingue (FR / EN / PL)", {
        en: "Multilingual production (FR / EN / PL)",
        pl: "Produkcja wielojęzyczna (FR / EN / PL)",
        es: "Producción multilingüe (FR / EN / PL)",
      }),
      level: 90,
      category: L("Autres", {
        en: "Other",
        pl: "Inne",
        es: "Otros",
      }),
      description: L(
        "Coordination de contenus multilingues, sous-titres et versions adaptées par marché.",
        {
          en: "Coordinating multilingual content, subtitles and market-specific versions.",
          pl: "Koordynacja treści wielojęzycznych, napisy i wersje pod rynki.",
          es: "Coordinación de contenidos multilingües, subtítulos y versiones por mercado.",
        }
      ),
      icons: [
        { id: "i1", emoji: "🌍", label: L("Langues", { en: "Languages", pl: "Języki", es: "Idiomas" }) },
        { id: "i2", emoji: "🗣️", label: L("VO/VF") },
      ],
    },
  ],
  education: [
    {
      id: "edu-m2",
      year: "2013",
      degree: L("Master 2 Management & Communication Web", {
        en: "Master’s in Management & Web Communication",
        pl: "Magister Management & Communication Web",
        es: "Máster en Management y Comunicación Web",
      }),
      school: L("ISEFAC Paris"),
      media: [],
    },
    {
      id: "edu-licence-com",
      year: "2011",
      degree: L("Licence Activités et Techniques de Communication", {
        en: "Bachelor’s in Communication Activities & Techniques",
        pl: "Licencjat: Działania i Techniki Komunikacji",
        es: "Grado en Actividades y Técnicas de Comunicación",
      }),
      school: L("UMLV"),
      media: [],
    },
    {
      id: "edu-licence-arts",
      year: "2009–2010",
      degree: L("Licence Arts et Technologies, option cinéma", {
        en: "Bachelor’s in Arts & Technologies, cinema track",
        pl: "Licencjat Sztuka i Technologie, ścieżka filmowa",
        es: "Grado en Artes y Tecnologías, opción cine",
      }),
      school: L("UMLV"),
      media: [],
    },
  ],
  contact: { ...DEFAULT_CONTACT },
  sectionLabels: { ...DEFAULT_SECTION_LABELS },
  mainShowreel: { ...DEFAULT_MAIN_SHOWREEL },
  featureVideos: DEFAULT_FEATURE_VIDEOS.map((f) => ({ ...f })),
  languages: [
    {
      id: "lang-fr",
      name: L("Français", {
        en: "French",
        pl: "Francuski",
        es: "Francés",
      }),
      level: L("Natif", {
        en: "Native",
        pl: "Ojczysty",
        es: "Nativo",
      }),
      videoType: "none",
      videoUrl: null,
      icons: [
        { id: "fr-i1", kind: "flag", region: "FR" },
        { id: "fr-i2", kind: "monument", region: "FR", emoji: "🗼" },
        { id: "fr-i3", kind: "culture", region: "FR", emoji: "🍷" },
        { id: "fr-i4", kind: "flag", region: "BE" },
        { id: "fr-i5", kind: "culture", region: "BE", emoji: "🍺" },
        { id: "fr-i6", kind: "flag", region: "CH" },
        { id: "fr-i7", kind: "monument", region: "CH", emoji: "⛰️" },
        { id: "fr-i8", kind: "flag", region: "CA" },
        { id: "fr-i9", kind: "culture", region: "CA", emoji: "🍁" },
        { id: "fr-i10", kind: "outline", region: "FR" },
      ],
      outlines: [
        { id: "fr-o1", code: "FR", label: L("France", { en: "France", pl: "Francja", es: "Francia" }) },
        { id: "fr-o2", code: "BE", label: L("Belgique", { en: "Belgium", pl: "Belgia", es: "Bélgica" }) },
        { id: "fr-o3", code: "CH", label: L("Suisse", { en: "Switzerland", pl: "Szwajcaria", es: "Suiza" }) },
        { id: "fr-o4", code: "CA", label: L("Canada") },
        { id: "fr-o5", code: "LU", label: L("Luxembourg") },
      ],
      primaryRegion: "FR",
      regions: ["FR", "BE", "CH", "CA", "LU"],
    },
    {
      id: "lang-en",
      name: L("Anglais", {
        en: "English",
        pl: "Angielski",
        es: "Inglés",
      }),
      level: L("Courant", {
        en: "Fluent",
        pl: "Biegły",
        es: "Fluido",
      }),
      videoType: "none",
      videoUrl: null,
      icons: [
        { id: "en-i1", kind: "flag", region: "GB" },
        { id: "en-i2", kind: "monument", region: "GB", emoji: "🏰" },
        { id: "en-i3", kind: "culture", region: "GB", emoji: "☕" },
        { id: "en-i4", kind: "flag", region: "US" },
        { id: "en-i5", kind: "monument", region: "US", emoji: "🗽" },
        { id: "en-i6", kind: "flag", region: "CA" },
        { id: "en-i7", kind: "flag", region: "AU" },
        { id: "en-i8", kind: "culture", region: "AU", emoji: "🪃" },
        { id: "en-i9", kind: "flag", region: "IE" },
        { id: "en-i10", kind: "culture", region: "IE", emoji: "☘️" },
      ],
      outlines: [
        { id: "en-o1", code: "GB", label: L("Royaume-Uni", { en: "United Kingdom", pl: "Wielka Brytania", es: "Reino Unido" }) },
        { id: "en-o2", code: "US", label: L("États-Unis", { en: "United States", pl: "Stany Zjednoczone", es: "Estados Unidos" }) },
        { id: "en-o3", code: "CA", label: L("Canada") },
        { id: "en-o4", code: "AU", label: L("Australie", { en: "Australia", pl: "Australia", es: "Australia" }) },
        { id: "en-o5", code: "IE", label: L("Irlande", { en: "Ireland", pl: "Irlandia", es: "Irlanda" }) },
      ],
      primaryRegion: "GB",
      regions: ["GB", "US", "CA", "AU", "IE"],
    },
    {
      id: "lang-pl",
      name: L("Polonais", {
        en: "Polish",
        pl: "Polski",
        es: "Polaco",
      }),
      level: L("Courant", {
        en: "Fluent",
        pl: "Biegły",
        es: "Fluido",
      }),
      videoType: "none",
      videoUrl: null,
      icons: [
        { id: "pl-i1", kind: "flag", region: "PL" },
        { id: "pl-i2", kind: "outline", region: "PL" },
        { id: "pl-i3", kind: "monument", region: "PL", emoji: "🏰" },
        { id: "pl-i4", kind: "culture", region: "PL", emoji: "🥟" },
        { id: "pl-i5", kind: "flag", region: "LT" },
        { id: "pl-i6", kind: "flag", region: "UA" },
      ],
      outlines: [
        { id: "pl-o1", code: "PL", label: L("Pologne", { en: "Poland", pl: "Polska", es: "Polonia" }) },
        { id: "pl-o2", code: "LT", label: L("Lituanie", { en: "Lithuania", pl: "Litwa", es: "Lituania" }) },
        { id: "pl-o3", code: "UA", label: L("Ukraine", { en: "Ukraine", pl: "Ukraina", es: "Ucrania" }) },
        { id: "pl-o4", code: "DE", label: L("Allemagne", { en: "Germany", pl: "Niemcy", es: "Alemania" }) },
      ],
      primaryRegion: "PL",
      regions: ["PL", "LT", "UA", "DE"],
    },
  ],
};
