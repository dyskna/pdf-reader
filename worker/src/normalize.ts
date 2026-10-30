// Gemini nie pilnuje wzorca kodu waluty ze schematu (pattern), więc model czasem zwraca
// "zł", "€" albo "EUR/m²". Zamieniamy to na kod ISO 4217 przed walidacją Zodem.

// Lista kodów ISO 4217 z wbudowanego Intl
const ISO_CODES = new Set(Intl.supportedValuesOf('currency'))

const SYMBOLS: [string, string][] = [
  ['ZŁ', 'PLN'],
  ['ZL', 'PLN'],
  ['€', 'EUR'],
  ['$', 'USD'],
  ['£', 'GBP'],
]

// "zł" → "PLN", "EUR/m²" → "EUR", "pln" → "PLN". Gdy nie da się ustalić kodu,
// zwraca wartość bez zmian (walidacja ją odrzuci).
export function normalizeCurrency(raw: string): string {
  const upper = raw.trim().toUpperCase()
  if (ISO_CODES.has(upper)) return upper
  const symbol = SYMBOLS.find(([prefix]) => upper.startsWith(prefix))
  if (symbol) return symbol[1]
  const code = upper.match(/[A-Z]{3}/)?.[0]
  return code && ISO_CODES.has(code) ? code : raw
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Odpowiedź modelu przed walidacją: poprawiamy pole currency w kwotach, a pozycje,
// których „waluta” nie jest kodem ISO (np. "m²", "kW"), usuwamy, bo to nie są kwoty
// pieniężne, tylko powierzchnia czy moc. Inne błędy zostają dla walidacji Zodem.
export function normalizeModelOutput(output: unknown): unknown {
  if (!isRecord(output) || !Array.isArray(output.amounts)) return output
  return {
    ...output,
    amounts: output.amounts
      .map((amount: unknown) =>
        isRecord(amount) && typeof amount.currency === 'string'
          ? { ...amount, currency: normalizeCurrency(amount.currency) }
          : amount,
      )
      .filter(
        (amount: unknown) =>
          !isRecord(amount) ||
          typeof amount.currency !== 'string' ||
          ISO_CODES.has(amount.currency),
      ),
  }
}
