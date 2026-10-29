import { z } from 'zod'

// Jedyny schemat wyniku analizy w projekcie. Worker importuje go stąd.
// Klucze po angielsku, wartości w języku dokumentu. Brak informacji = null albo [].

export const documentTypes = [
  'faktura',
  'umowa',
  'oferta',
  'raport',
  'inne',
] as const

// ISO 8601, sama data: RRRR-MM-DD
const isoDate = z.iso.date()

export const analysisResultSchema = z.object({
  document: z.object({
    // fileName i pages podaje przeglądarka, nie model
    fileName: z.string(),
    pages: z.number().int().positive(),
    // ISO 639-1, np. "pl"
    language: z.string().regex(/^[a-z]{2}$/),
    type: z.enum(documentTypes),
    title: z.string().nullable(),
    date: isoDate.nullable(),
  }),
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).min(3).max(7),
  entities: z.object({
    organizations: z.array(z.string()),
    people: z.array(z.string()),
  }),
  amounts: z.array(
    z.object({
      value: z.number(),
      // ISO 4217, np. "PLN"
      currency: z.string().regex(/^[A-Z]{3}$/),
      context: z.string(),
    }),
  ),
  dates: z.array(
    z.object({
      date: isoDate,
      context: z.string(),
    }),
  ),
  keywords: z.array(z.string()),
  // Numery stron-skanów, których użytkownik nie wysłał do OCR
  skippedPages: z.array(z.number().int().positive()),
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>
