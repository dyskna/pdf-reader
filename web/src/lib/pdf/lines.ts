// Element tekstu z pdf.js sprowadzony do pól, których potrzebujemy.
// x, y to pozycja początku tekstu na stronie (y rośnie w górę strony).
export type TextPiece = {
  str: string
  x: number
  y: number
  width: number
  height: number // mniej więcej wielkość czcionki
  hasEOL: boolean
}

// Ułamki wysokości tekstu, od których uznajemy, że:
const NEW_LINE_Y_SHIFT = 0.5 // element jest już w innej linii
const WORD_GAP = 0.2 // między elementami jest odstęp jak między słowami
const COLUMN_GAP = 2 // to osobna kolumna albo komórka tabeli

// Składa elementy tekstu z pdf.js (w kolejności z pdf.js) w linie.
// Nowa linia: pdf.js zgłosił koniec linii (hasEOL) albo zmieniła się wysokość y.
// Duży odstęp w poziomie zaznaczamy " | ", żeby kolumny i komórki tabeli się nie zlewały.
export function piecesToLines(pieces: TextPiece[]): string[] {
  const lines: string[] = []
  let current = ''
  let previous: TextPiece | null = null // ostatni element z tekstem
  let endOfLine = false // pdf.js zgłosił koniec linii po ostatnim tekście

  for (const piece of pieces) {
    // pdf.js wstawia elementy z samych spacji, które wypełniają całą przerwę (też między
    // kolumnami). Pomijamy je i liczymy odstęp od ostatniego tekstu. Zachowujemy tylko hasEOL.
    if (piece.str.trim() === '') {
      if (piece.hasEOL) endOfLine = true
      continue
    }

    if (previous) {
      const size = Math.max(previous.height, piece.height, 1)
      const yShift = Math.abs(piece.y - previous.y)
      const gap = piece.x - (previous.x + previous.width)

      if (endOfLine || yShift > size * NEW_LINE_Y_SHIFT) {
        lines.push(current)
        current = ''
      } else if (gap > size * COLUMN_GAP) {
        current += ' | '
      } else if (gap > size * WORD_GAP) {
        current += ' '
      }
    }
    current += piece.str
    previous = piece
    endOfLine = piece.hasEOL
  }
  lines.push(current)

  return lines
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '')
}
