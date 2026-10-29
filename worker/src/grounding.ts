import type { ModelOutput } from '../../web/src/lib/schema'

type Amount = ModelOutput['amounts'][number]

// Liczby w tekście: "12 500,00", "12.500,00", "12,500.00", "12500", "1,5".
// Pierwszy wariant: grupy tysięcy (spacja, spacja niełamliwa, kropka, przecinek), opcjonalnie grosze.
const NUMBER_PATTERN =
  /\d{1,3}(?:[ \u00a0\u202f.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g

// Zwraca wszystkie możliwe wartości liczb zapisanych w tekście.
// Zapis bywa niejednoznaczny ("12.500" to 12500 albo 12,5), więc liczymy oba odczyty.
export function extractNumbers(text: string): number[] {
  const numbers: number[] = []
  for (const [token] of text.matchAll(NUMBER_PATTERN)) {
    const compact = token.replace(/[ \u00a0\u202f]/g, '')
    // Odczyt 1: wszystkie kropki i przecinki to separatory tysięcy
    numbers.push(Number(compact.replace(/[.,]/g, '')))
    // Odczyt 2: ostatni separator z 1–2 cyframi po nim to część dziesiętna
    const decimal = compact.match(/^(.*)[.,](\d{1,2})$/)
    if (decimal) {
      numbers.push(Number(`${decimal[1].replace(/[.,]/g, '')}.${decimal[2]}`))
    }
  }
  return numbers
}

// Filtr ugruntowania: usuwa kwoty, których wartości nie ma w tekście z pdf.js.
// Kwot ze skanów (source "ocr") nie da się sprawdzić w tekście, więc zostają,
// ale tylko gdy skany rzeczywiście były wysłane.
export function filterUngroundedAmounts(
  amounts: Amount[],
  documentText: string,
  scansSent: boolean,
): Amount[] {
  const numbers = extractNumbers(documentText)
  return amounts.filter((amount) => {
    if (amount.source === 'ocr' && scansSent) return true
    const value = Math.abs(amount.value)
    return numbers.some((number) => Math.abs(number - value) < 0.005)
  })
}
