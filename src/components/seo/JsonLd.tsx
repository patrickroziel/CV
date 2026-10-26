import { getNoteSharePhoto, getNoteShareText, NOTES_ORIGIN } from "@/lib/server/notes-sharing";
import type { SocialPost } from "@/lib/types";

function jsonLdScript(data: unknown) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function SiteJsonLd() {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${NOTES_ORIGIN}/#website`,
        url: NOTES_ORIGIN,
        name: "Patrick Roziel",
        description:
          "Notes, Air et Work de Patrick Roziel : écrits, décryptages et portfolio de montage vidéo.",
        inLanguage: "fr-FR",
        publisher: { "@id": `${NOTES_ORIGIN}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${NOTES_ORIGIN}/#person`,
        name: "Patrick Roziel",
        url: NOTES_ORIGIN,
        jobTitle: "Monteur vidéo, motion designer et créateur de contenus",
        description:
          "Je crée et monte des contenus pour le web, les réseaux sociaux et la communication.",
        image: "https://res.cloudinary.com/ptp8diwd/image/upload/v1784742778/ih9243zrqradcoauy6vi.png",
        email: "patrickroziel@gmail.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "La Courneuve",
          postalCode: "93120",
          addressCountry: "FR",
        },
        knowsLanguage: ["fr", "en", "pl", "es"],
        sameAs: [
          "https://x.com/patwithnoE",
          "https://www.tiktok.com/@patwithnoe",
          "https://github.com/patrickroziel",
          "https://www.youtube.com/watch?v=iPLN2ODs0jE",
        ],
      },
    ],
  });
}

export function ArticleJsonLd({
  post,
  path,
  section,
}: {
  post: SocialPost;
  path: string;
  section: "Notes" | "Air";
}) {
  const { title, description } = getNoteShareText(post);
  const image = getNoteSharePhoto(post);
  const url = `${NOTES_ORIGIN}${path}`;
  const published = /^\d{4}-\d{2}-\d{2}/.test(post.date) ? post.date : undefined;

  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": post.category === "Livre" ? "Chapter" : "Article",
    headline: title,
    description,
    inLanguage: "fr-FR",
    datePublished: published,
    mainEntityOfPage: url,
    url,
    image: image ? [image] : undefined,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
    articleSection: section,
    author: { "@id": `${NOTES_ORIGIN}/#person` },
    publisher: { "@id": `${NOTES_ORIGIN}/#person` },
    isPartOf: { "@id": `${NOTES_ORIGIN}/#website` },
  });
}
