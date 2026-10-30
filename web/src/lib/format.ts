import type { AnalysisResult } from './schema'

// Formatowanie wartości do wyświetlenia (polskie zapisy jak w projekcie).

// "2026-03-14" → "14.03.2026". Operujemy na tekście, żeby strefa czasowa nie przesunęła dnia.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

const amountFormat = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// 12500 → "12 500,00" (separator tysięcy to spacja niełamliwa z Intl)
export function formatAmount(value: number): string {
  return amountFormat.format(value)
}

// Kod ISO 4217 → zapis przy kwocie; złotówki jak w polskich dokumentach
export function currencyLabel(code: string): string {
  return code === 'PLN' ? 'zł' : code
}

const languageNames = new Intl.DisplayNames(['pl'], { type: 'language' })

// "pl" → "polski", "en" → "angielski"; nieznany kod zostaje bez zmian
export function languageName(code: string): string {
  try {
    return languageNames.of(code) ?? code
  } catch {
    return code
  }
}

const typeLabels: Record<AnalysisResult['document']['type'], string> = {
  faktura: 'Faktura',
  umowa: 'Umowa',
  oferta: 'Oferta',
  raport: 'Raport',
  inne: 'Inny dokument',
}

export function documentTypeLabel(
  type: AnalysisResult['document']['type'],
): string {
  return typeLabels[type]
}

// [11] → "str. 11", [3, 11] → "str. 3, 11", [] → "brak"
export function formatSkippedPages(pages: number[]): string {
  return pages.length === 0 ? 'brak' : `str. ${pages.join(', ')}`
}

const sizeFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })

// 51200 → "50 KB", 1572864 → "1,5 MB"
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`
}

const dateTimeFormat = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

// Data zapisu w historii (ISO z godziną) → "30.10.2026, 11:58"
export function formatDateTime(isoDateTime: string): string {
  return dateTimeFormat.format(new Date(isoDateTime))
}
