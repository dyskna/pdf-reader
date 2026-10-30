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

// Słowa skali („212,4 mln zł”, nagłówek tabeli „(mln zł)”) i ich mnożniki.
// Model podaje pełną wartość (212400000), a w tekście jest 212,4.
const SCALES: [RegExp, number][] = [
  [/tys\.|tysi[ęą]c|thousand/i, 1e3],
  [/mln|milion|million/i, 1e6],
  [/mld|miliard|billion/i, 1e9],
]

// Filtr ugruntowania: usuwa kwoty, których wartości nie ma w tekście z pdf.js.
// Źródło ustalamy sami, bo model potrafi oznaczyć kwotę z tekstu jako "ocr":
// - kwota jest w tekście: zostaje, source "text";
// - nie ma jej w tekście, ale model wskazał skan i skany były wysłane: zostaje, source "ocr"
//   (tekstu skanu nie znamy, więc nie da się jej sprawdzić);
// - w pozostałych przypadkach kwota jest usuwana.
// Kwotę w tysiącach, milionach albo miliardach uznajemy tylko wtedy, gdy dokument
// w ogóle używa danej skali (np. słowa „mln”).
export function filterUngroundedAmounts(
  amounts: Amount[],
  documentText: string,
  scansSent: boolean,
): Amount[] {
  const numbers = extractNumbers(documentText)
  const scales = [
    1,
    ...SCALES.filter(([word]) => word.test(documentText)).map(
      ([, scale]) => scale,
    ),
  ]
  const isInText = (value: number) =>
    scales.some((scale) =>
      numbers.some((number) => Math.abs(number - value / scale) < 0.005),
    )

  return amounts.flatMap((amount): Amount[] => {
    if (isInText(Math.abs(amount.value))) {
      return [{ ...amount, source: 'text' }]
    }
    return amount.source === 'ocr' && scansSent ? [amount] : []
  })
}
