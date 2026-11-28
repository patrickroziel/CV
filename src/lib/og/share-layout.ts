const CHAR_WIDTH = 0.56;

function wrapWords(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= maxChars) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function layoutShareText(title: string, subtitle: string, width: number, height: number) {
  const marginX = Math.round(Math.max(72, width * 0.075));
  const marginY = Math.round(Math.max(56, height * (height > width ? 0.08 : 0.11)));
  const innerW = Math.max(120, width - marginX * 2);
  const innerH = Math.max(80, height - marginY * 2);
  const titleText = title.replace(/\s+/g, " ").trim().toLocaleUpperCase("fr-FR") || "PATRICK ROZIEL";
  const subText = subtitle.replace(/\s+/g, " ").trim().toLocaleUpperCase("fr-FR");
  const tall = height > width;
  let titleSize = tall ? 108 : 86;
  const minTitle = tall ? 34 : 26;
  let subSize = Math.round(titleSize * 0.46);
  let gap = Math.round(titleSize * 0.2);
  let titleLines = [titleText];
  let subLines: string[] = subText ? [subText] : [];

  for (let step = 0; step < 48; step += 1) {
    const titleChars = Math.max(4, Math.floor(innerW / (titleSize * CHAR_WIDTH)));
    const subChars = Math.max(6, Math.floor(innerW / Math.max(1, subSize * CHAR_WIDTH)));
    titleLines = wrapWords(titleText, titleChars);
    subLines = subText ? wrapWords(subText, subChars) : [];
    const titleTooWide = titleLines.some((line) => line.length * titleSize * CHAR_WIDTH > innerW);
    const subTooWide = subLines.some((line) => line.length * subSize * CHAR_WIDTH > innerW);
    const blockH =
      titleLines.length * titleSize +
      Math.max(0, titleLines.length - 1) * titleSize * 0.28 +
      (subLines.length ? gap + subLines.length * subSize + Math.max(0, subLines.length - 1) * subSize * 0.22 : 0);
    if (!titleTooWide && !subTooWide && blockH <= innerH) break;
    if (titleSize <= minTitle) {
      if (subSize > 15) {
        subSize -= 2;
        gap = Math.max(8, gap - 1);
        continue;
      }
      break;
    }
    titleSize -= 3;
    subSize = Math.max(15, Math.round(titleSize * 0.46));
    gap = Math.max(8, Math.round(titleSize * 0.18));
  }

  return { titleLines, subLines, titleSize, subSize, gap, marginX, marginY, innerW, innerH };
}
