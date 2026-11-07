import { getL, type MaybeLocalized } from "@/lib/i18n-content";

export const AIR_NOTICE_INTRO =
  "Témoignage personnel. Les faits relatés sont ceux que j’ai vécus ou perçus ; les personnes citées n’ont pas été sollicitées pour cette publication et disposent d’un droit de réponse, publié dans les mêmes conditions (voir en fin de texte).";

export const AIR_NOTICE_REPLY =
  "Droit de réponse. Toute personne ou entreprise citée dans ce texte peut demander une réponse, qui sera publiée dans les mêmes conditions et avec une visibilité équivalente. Les faits rapportés sont ceux que j’ai vécus ou perçus ; ils ne constituent pas des vérités générales sur les personnes mentionnées.";

export const BOOK_NOTICE =
  "Je partage ici, au fil de leur écriture, les chapitres d’un livre en cours, à mi-chemin entre récit personnel et réflexion. Sans être une autobiographie, ce projet s’appuie sur mes expériences pour explorer, questionner et tenter de déchiffrer ce qu’est une vie.";

export function airNoticeHtml(value: MaybeLocalized, fallback: string) {
  const text = getL(value, "fr").trim();
  return text || `<p>${fallback}</p>`;
}
