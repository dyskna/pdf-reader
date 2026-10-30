import { z } from 'zod'

// Jedyny schemat wyniku analizy w projekcie. Worker importuje go stąd.
// Klucze po angielsku, wartości w języku dokumentu. Brak informacji = null albo [].
// Opisy (.describe) trafiają do schematu JSON dla modelu, dlatego są po angielsku.

export const documentTypes = [
  'faktura',
  'umowa',
  'oferta',
  'raport',
  'inne',
] as const

// ISO 8601, sama data: RRRR-MM-DD
const isoDate = z.iso.date()

const documentSchema = z.object({
  // fileName i pages podaje przeglądarka, nie model
  fileName: z.string(),
  pages: z.number().int().positive(),
  language: z
    .string()
    .regex(/^[a-z]{2}$/)
    .describe('ISO 639-1 code of the main language of the document, e.g. "pl"'),
  type: z.enum(documentTypes),
  title: z.string().nullable(),
  date: isoDate
    .nullable()
    .describe('Main date of the document (e.g. signing or issue date)'),
})

const amountSchema = z.object({
  value: z.number(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .describe('ISO 4217 currency code, e.g. "PLN"'),
  context: z.string().describe('What the amount is for'),
  // Skąd kwota: z warstwy tekstowej PDF albo z obrazu skanu (OCR)
  source: z
    .enum(['text', 'ocr'])
    .describe('"ocr" if the amount was read from a scanned page image'),
})

export const analysisResultSchema = z.object({
  document: documentSchema,
  summary: z
    .string()
    .min(1)
    .describe('3-5 sentences in the language of the document'),
  keyPoints: z.array(z.string()).min(3).max(7),
  entities: z.object({
    organizations: z.array(z.string()),
    people: z.array(z.string()),
  }),
  amounts: z.array(amountSchema),
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

// To, co ma zwrócić model: bez pól, które zna przeglądarka (fileName, pages, skippedPages).
export const modelOutputSchema = analysisResultSchema
  .omit({ skippedPages: true })
  .extend({ document: documentSchema.omit({ fileName: true, pages: true }) })

export type ModelOutput = z.infer<typeof modelOutputSchema>
