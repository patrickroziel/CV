import { getL, type MaybeLocalized } from "@/lib/i18n-content";

export const AIR_NOTICE_INTRO =
  "Témoignage personnel. Les faits relatés sont ceux que j’ai vécus ou perçus ; les personnes citées n’ont pas été sollicitées pour cette publication et disposent d’un droit de réponse, publié dans les mêmes conditions (voir en fin de texte).";

export const AIR_NOTICE_REPLY =
  "Droit de réponse. Toute personne ou entreprise citée dans ce texte peut demander une réponse, qui sera publiée dans les mêmes conditions et avec une visibilité équivalente. Les faits rapportés sont ceux que j’ai vécus ou perçus ; ils ne constituent pas des vérités générales sur les personnes mentionnées.";

export function airNoticeHtml(value: MaybeLocalized, fallback: string) {
  const text = getL(value, "fr").trim();
  return text || `<p>${fallback}</p>`;
}
