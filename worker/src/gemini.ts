import { z } from 'zod'
import { modelOutputSchema, type ModelOutput } from '../../web/src/lib/schema'
import { SYSTEM_INSTRUCTION, type GeminiPart } from './prompt'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIME_LIMIT_MS = 28_000 // wspólny dla obu prób, żeby zmieścić się w 30 s
const MAX_ATTEMPTS = 2 // pierwsza próba + 1 ponowna

// Schemat odpowiedzi dla Gemini generowany z Zoda, żeby nie trzymać drugiej kopii.
const responseJsonSchema = z.toJSONSchema(modelOutputSchema)

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

export async function analyzeWithGemini(
  parts: GeminiPart[],
  env: GeminiEnv,
): Promise<ModelOutput> {
  const signal = AbortSignal.timeout(TIME_LIMIT_MS)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const output = await callGemini(parts, env, signal)
    const parsed = modelOutputSchema.safeParse(output)
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
  parts: GeminiPart[],
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
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema,
            temperature: 0.2,
          },
        }),
        signal,
      },
    )

    if (response.status === 429) {
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
