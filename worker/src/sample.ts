import type { AnalysisResult } from '../../web/src/lib/schema'

// Przykładowy wynik na etap 1, zanim podłączymy Gemini (etap 3).
export const sampleResult: AnalysisResult = {
  document: {
    fileName: 'przyklad.pdf',
    pages: 1,
    language: 'pl',
    type: 'umowa',
    title: 'Przykładowa umowa',
    date: '2026-01-15',
  },
  summary:
    'To jest przykładowy wynik z serwera. Prawdziwa analiza AI pojawi się w kolejnym etapie. Kształt danych jest już zgodny ze schematem.',
  keyPoints: [
    'Serwer działa i odpowiada',
    'Odpowiedź przechodzi walidację schematu',
    'Analiza AI zostanie dodana później',
  ],
  entities: {
    organizations: ['Przykładowa Firma sp. z o.o.'],
    people: ['Jan Kowalski'],
  },
  amounts: [{ value: 1000, currency: 'PLN', context: 'Przykładowa kwota' }],
  dates: [{ date: '2026-01-15', context: 'Data zawarcia umowy' }],
  keywords: ['przykład', 'umowa'],
  skippedPages: [],
}
