import { corsHeaders, isAllowedOrigin } from './cors'
import { sampleResult } from './sample'

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

    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Dozwolona jest tylko metoda POST.' },
        { status: 405, headers: { ...corsHeaders(origin), Allow: 'POST' } },
      )
    }

    return Response.json(sampleResult, { headers: corsHeaders(origin) })
  },
} satisfies ExportedHandler<Env>
