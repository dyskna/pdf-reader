import { z } from 'zod'
import { modelOutputSchema, type ModelOutput } from '../../web/src/lib/schema'
import {
  SUMMARY_INSTRUCTION,
  SYSTEM_INSTRUCTION,
  type GeminiPart,
} from './prompt'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MAX_ATTEMPTS = 2 // pierwsza próba + 1 ponowna

// Wspólny limit na całą analizę (wszystkie wywołania i ponowne próby), żeby zmieścić się w 30 s
export const ANALYSIS_TIME_LIMIT_MS = 28_000

// Końcowe podsumowanie długiego dokumentu: tylko summary i keyPoints
const summarySchema = modelOutputSchema.pick({ summary: true, keyPoints: true })
export type Summary = z.infer<typeof summarySchema>

// Schematy odpowiedzi dla Gemini generowane z Zoda, żeby nie trzymać drugiej kopii.
const analysisJsonSchema = z.toJSONSchema(modelOutputSchema)
const summaryJsonSchema = z.toJSONSchema(summarySchema)

// Interesuje nas tylko tekst odpowiedzi. Reszta pól Gemini jest pomijana.
const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({ parts: z.array(z.object({ text: z.string().optional() })) })
          .optional(),
      }),
    )
    .optional(),
})

// Błąd z kodem HTTP i komunikatem po polsku dla użytkownika.
export class AnalysisError extends Error {
  status: number

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options)
    this.status = status
  }
}

type GeminiEnv = Pick<Env, 'GEMINI_API_KEY' | 'GEMINI_MODEL'>

// Analiza dokumentu albo jednego fragmentu długiego dokumentu
export function analyzeWithGemini(
  parts: GeminiPart[],
  env: GeminiEnv,
  signal: AbortSignal,
): Promise<ModelOutput> {
  const request = {
    systemInstruction: SYSTEM_INSTRUCTION,
    jsonSchema: analysisJsonSchema,
    parts,
  }
  return generateValidated(modelOutputSchema, request, env, signal)
}

// Końcowe podsumowanie z podsumowań fragmentów
export function summarizeWithGemini(
  parts: GeminiPart[],
  env: GeminiEnv,
  signal: AbortSignal,
): Promise<Summary> {
  const request = {
    systemInstruction: SUMMARY_INSTRUCTION,
    jsonSchema: summaryJsonSchema,
    parts,
  }
  return generateValidated(summarySchema, request, env, signal)
}

type GeminiRequest = {
  systemInstruction: string
  jsonSchema: unknown
  parts: GeminiPart[]
}

// Wywołanie z walidacją Zodem i 1 ponowną próbą przy niepoprawnej odpowiedzi
async function generateValidated<T>(
  schema: z.ZodType<T>,
  request: GeminiRequest,
  env: GeminiEnv,
  signal: AbortSignal,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const output = await callGemini(request, env, signal)
    const parsed = schema.safeParse(output)
    if (parsed.success) return parsed.data

    // Logujemy tylko ścieżki pól z błędem, bez treści dokumentu
    const paths = parsed.error.issues.map((issue) => issue.path.join('.'))
    console.warn(`Gemini: niepoprawna odpowiedź (próba ${attempt}):`, paths)
  }
  throw new AnalysisError(
    502,
    'Model AI zwrócił niepoprawną odpowiedź. Spróbuj ponownie.',
  )
}

// Zwraca odpowiedź modelu jako obiekt z JSON-a albo null, gdy to nie jest JSON.
async function callGemini(
  request: GeminiRequest,
  env: GeminiEnv,
  signal: AbortSignal,
): Promise<unknown> {
  let data: unknown
  try {
    const response = await fetch(
      `${GEMINI_URL}/${env.GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemInstruction }] },
          contents: [{ role: 'user', parts: request.parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: request.jsonSchema,
            temperature: 0.2,
          },
        }),
        signal,
      },
    )

    // 429: wyczerpany limit darmowego tieru, 503: model przeciążony po stronie Google
    if (response.status === 429 || response.status === 503) {
      throw new AnalysisError(
        503,
        'Usługa AI jest chwilowo przeciążona. Spróbuj ponownie za minutę.',
      )
    }
    if (!response.ok) {
      // Treść błędu Gemini (bez dokumentu) pomaga w diagnozie przez `wrangler tail`
      const details = (await response.text()).slice(0, 500)
      console.error(`Gemini HTTP ${response.status}: ${details}`)
      throw new AnalysisError(502, 'Usługa AI zwróciła błąd. Spróbuj ponownie.')
    }
    data = await response.json()
  } catch (error) {
    if (error instanceof AnalysisError) throw error
    if (signal.aborted) {
      throw new AnalysisError(
        504,
        'Analiza trwała zbyt długo. Spróbuj ponownie albo wybierz krótszy dokument.',
        { cause: error },
      )
    }
    throw new AnalysisError(502, 'Nie udało się połączyć z usługą AI.', {
      cause: error,
    })
  }

  const parsed = geminiResponseSchema.safeParse(data)
  const textParts = parsed.success
    ? (parsed.data.candidates?.[0]?.content?.parts ?? [])
    : []
  const text = textParts.map((part) => part.text ?? '').join('')
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
