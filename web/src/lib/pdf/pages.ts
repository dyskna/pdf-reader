export type PageText = {
  page: number // numer strony od 1
  text: string
}

// Strona z mniejszą liczbą znaków (bez białych znaków) to prawdopodobnie skan.
// Próg z zapasem na znak wodny typu „POUFNE” albo sam numer strony.
export const SCAN_TEXT_THRESHOLD = 30

export function isLikelyScan(pageText: string): boolean {
  return pageText.replace(/\s/g, '').length < SCAN_TEXT_THRESHOLD
}

// Tekst wysyłany do analizy: każda strona z oznaczeniem [Strona N], bez stron pominiętych.
export function buildDocumentText(
  pages: PageText[],
  skippedPages: number[],
): string {
  return pages
    .filter((page) => !skippedPages.includes(page.page))
    .map((page) => `[Strona ${page.page}]\n${page.text}`)
    .join('\n\n')
}
