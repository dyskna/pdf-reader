import type { AnalysisResult } from './schema'

// "Umowa 14/2026.pdf" → "Umowa 14-2026-analiza.json"
// Znaki niedozwolone w nazwach plików zamieniamy na myślnik, bez myślników na brzegach.
export function jsonFileName(pdfFileName: string): string {
  const base =
    pdfFileName
      .replace(/\.pdf$/i, '')
      .replace(/[/:*?"<>|]+/g, '-')
      .replace(/^[-\s]+|[-\s]+$/g, '') || 'dokument'
  return `${base}-analiza.json`
}

// Plik powstaje w przeglądarce: Blob + tymczasowy link z atrybutem download.
export function downloadJson(result: AnalysisResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = jsonFileName(result.document.fileName)
  link.click()
  // Zwalniamy pamięć po rozpoczęciu pobierania
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
