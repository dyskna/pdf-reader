import type { AnalysisResult } from '../../web/src/lib/schema'
import { corsHeaders, isAllowedOrigin } from './cors'
import { AnalysisError, analyzeWithGemini } from './gemini'
import { filterUngroundedAmounts } from './grounding'
import { buildParts } from './prompt'
import { analyzeRequestSchema, MAX_REQUEST_BYTES } from './request'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/analyze') {
      return Response.json({ error: 'Nie znaleziono.' }, { status: 404 })
    }

    const origin = request.headers.get('Origin')
    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGIN)) {
      return Response.json(
        { error: 'Brak dostępu z tej strony.' },
        { status: 403 },
      )
    }

    // Preflight: przeglądarka pyta, czy może wysłać POST z JSON-em
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // Od tego miejsca każda odpowiedź ma nagłówki CORS, żeby przeglądarka pokazała komunikat
    const reply = (body: unknown, status: number, extraHeaders = {}) =>
      Response.json(body, {
        status,
        headers: { ...corsHeaders(origin), ...extraHeaders },
      })

    if (request.method !== 'POST') {
      return reply({ error: 'Dozwolona jest tylko metoda POST.' }, 405, {
        Allow: 'POST',
      })
    }

    // CF-Connecting-IP to adres klienta, który ustawia Cloudflare
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const { success } = await env.RATE_LIMITER.limit({ key: ip })
    if (!success) {
      return reply({ error: 'Za dużo żądań. Spróbuj ponownie za minutę.' }, 429)
    }

    if (Number(request.headers.get('Content-Length')) > MAX_REQUEST_BYTES) {
      return reply({ error: 'Żądanie jest za duże.' }, 413)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return reply({ error: 'Niepoprawne dane żądania.' }, 400)
    }

    const parsed = analyzeRequestSchema.safeParse(body)
    if (!parsed.success) {
      // Własne komunikaty po polsku mają tylko limity (too_big) i brak treści (custom)
      const issue = parsed.error.issues[0]
      const hasOwnMessage = issue.code === 'too_big' || issue.code === 'custom'
      return reply(
        { error: hasOwnMessage ? issue.message : 'Niepoprawne dane żądania.' },
        issue.code === 'too_big' ? 413 : 400,
      )
    }
    const input = parsed.data

    try {
      const output = await analyzeWithGemini(
        buildParts(input, crypto.randomUUID()),
        env,
      )
      const scansSent = (input.scans?.length ?? 0) > 0

      // fileName, pages i skippedPages podaje przeglądarka, nie model
      const result: AnalysisResult = {
        ...output,
        document: {
          ...output.document,
          fileName: input.fileName,
          pages: input.pages,
        },
        amounts: filterUngroundedAmounts(output.amounts, input.text, scansSent),
        skippedPages: input.skippedPages,
      }
      return reply(result, 200)
    } catch (error) {
      if (error instanceof AnalysisError) {
        return reply({ error: error.message }, error.status)
      }
      console.error('Nieoczekiwany błąd:', error)
      return reply({ error: 'Wystąpił nieoczekiwany błąd serwera.' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
