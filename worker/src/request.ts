import { z } from 'zod'

// Limity chronią Workera (10 ms CPU na planie Free) i mieszczą się w limicie Gemini (20 MB na żądanie).
export const MAX_REQUEST_BYTES = 10 * 1024 * 1024
export const MAX_TEXT_CHARS = 300_000
export const MAX_SCANS = 10
export const MAX_SCAN_BASE64_CHARS = 1_500_000

const pageNumber = z.number().int().positive()

export const analyzeRequestSchema = z
  .object({
    fileName: z.string().min(1).max(255),
    pages: pageNumber,
    text: z
      .string()
      .max(MAX_TEXT_CHARS, 'Dokument jest za długi (limit 300 000 znaków).'),
    skippedPages: z.array(pageNumber),
    // Obrazy stron-skanów (JPEG w base64), tylko za zgodą użytkownika.
    // Nie sprawdzamy base64 wyrażeniem regularnym: przy kilku MB zjadłoby limit CPU.
    // Błędne dane odrzuci Gemini.
    scans: z
      .array(
        z.object({
          page: pageNumber,
          data: z
            .string()
            .min(1)
            .max(MAX_SCAN_BASE64_CHARS, 'Obraz skanu jest za duży.'),
        }),
      )
      .max(MAX_SCANS, 'Za dużo stron-skanów (limit 10).')
      .optional(),
  })
  .refine((request) => request.text.trim() !== '' || request.scans?.length, {
    message: 'Brak treści do analizy.',
  })

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
