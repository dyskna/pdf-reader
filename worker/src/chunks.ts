import type { AnalyzeRequest } from './request'

// Dokument dłuższy niż tyle znaków analizujemy w kilku fragmentach równolegle
export const CHUNK_MAX_CHARS = 40_000

type Scan = NonNullable<AnalyzeRequest['scans']>[number]

export type Chunk = {
  firstPage: number
  text: string
  scans: Scan[]
}

// Przeglądarka łączy strony pustą linią, a każda zaczyna się od "[Strona N]"
const PAGE_START = /\n\n(?=\[Strona \d+\]\n)/
const PAGE_NUMBER = /^\[Strona (\d+)\]/

// Dzieli tekst po granicach stron na fragmenty do maxChars znaków.
// Strona dłuższa niż limit trafia do osobnego fragmentu w całości.
// Każdy skan trafia do fragmentu, w którym jest jego strona (albo strona przed nią).
export function splitIntoChunks(
  text: string,
  scans: Scan[],
  maxChars = CHUNK_MAX_CHARS,
): Chunk[] {
  const chunks: Chunk[] = []
  let current: Chunk | null = null

  for (const page of text.split(PAGE_START)) {
    const firstPage = Number(page.match(PAGE_NUMBER)?.[1] ?? 1)
    if (current && current.text.length + 2 + page.length <= maxChars) {
      current.text += `\n\n${page}`
    } else {
      current = { firstPage, text: page, scans: [] }
      chunks.push(current)
    }
  }

  for (const scan of scans) {
    const target =
      chunks.findLast((chunk) => chunk.firstPage <= scan.page) ?? chunks[0]
    target.scans.push(scan)
  }
  return chunks
}
