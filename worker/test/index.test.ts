import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analysisResultSchema,
  type ModelOutput,
} from '../../web/src/lib/schema'
import worker from '../src/index'

const allowedOrigin = 'https://dyskna.github.io'

function makeEnv(rateLimitOk = true): Env {
  return {
    ALLOWED_ORIGIN: allowedOrigin,
    GEMINI_MODEL: 'gemini-3.1-flash-lite',
    GEMINI_API_KEY: 'test-key',
    RATE_LIMITER: { limit: async () => ({ success: rateLimitOk }) },
  }
}

const validBody = {
  fileName: 'umowa.pdf',
  pages: 2,
  text: '[Strona 1]\nWynagrodzenie: 12 500,00 zł',
  skippedPages: [2],
}

const modelOutput: ModelOutput = {
  document: {
    language: 'pl',
    type: 'umowa',
    title: 'Umowa o dzieło',
    date: '2026-03-14',
  },
  summary: 'Umowa o dzieło na 12 500 zł.',
  keyPoints: ['Wynagrodzenie 12 500 zł', 'Strona 2 pominięta', 'Umowa'],
  entities: { organizations: [], people: [] },
  amounts: [
    { value: 12500, currency: 'PLN', context: 'Wynagrodzenie', source: 'text' },
    { value: 99999, currency: 'PLN', context: 'Zmyślona', source: 'text' },
  ],
  dates: [],
  keywords: ['umowa'],
}

// Nowa odpowiedź przy każdym wywołaniu: body Response można przeczytać tylko raz
function mockGemini(...texts: string[]) {
  const mock = vi.spyOn(globalThis, 'fetch')
  for (const text of texts) {
    mock.mockImplementationOnce(async () =>
      Response.json({ candidates: [{ content: { parts: [{ text }] } }] }),
    )
  }
  return mock
}

function request(
  method: string,
  origin: string | null,
  body?: unknown,
  path = '/analyze',
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (origin) headers.Origin = origin
  return new Request(`https://worker.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /analyze: analiza', () => {
  it('zwraca wynik z danymi z przeglądarki i bez zmyślonych kwot', async () => {
    const fetchMock = mockGemini(JSON.stringify(modelOutput))
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody),
      makeEnv(),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      allowedOrigin,
    )
    const result = analysisResultSchema.parse(await response.json())
    expect(result.document.fileName).toBe('umowa.pdf')
    expect(result.document.pages).toBe(2)
    expect(result.skippedPages).toEqual([2])
    expect(result.amounts.map((amount) => amount.value)).toEqual([12500])

    // Klucz idzie w nagłówku do Gemini, nie w adresie
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('gemini-3.1-flash-lite:generateContent')
    expect(String(url)).not.toContain('test-key')
    expect(new Headers(init?.headers).get('x-goog-api-key')).toBe('test-key')
  })

  it('ponawia raz, gdy model zwróci coś, co nie jest JSON-em', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = mockGemini('to nie JSON', JSON.stringify(modelOutput))
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody),
      makeEnv(),
    )
    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('po dwóch złych odpowiedziach zwraca 502 z komunikatem po polsku', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = mockGemini('{"summary": 1}', '{"summary": 2}')
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody),
      makeEnv(),
    )
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({
      error: 'Model AI zwrócił niepoprawną odpowiedź. Spróbuj ponownie.',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('limit Gemini (429) zamienia na 503', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response('quota', { status: 429 }),
    )
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody),
      makeEnv(),
    )
    expect(response.status).toBe(503)
  })

  it('przeciążony model Gemini (503) zwraca 503 z komunikatem', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response('high demand', { status: 503 }),
    )
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody),
      makeEnv(),
    )
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Usługa AI jest chwilowo przeciążona. Spróbuj ponownie za minutę.',
    })
  })
})

describe('POST /analyze: ochrona i walidacja', () => {
  it('po przekroczeniu rate limitu zwraca 429 i nie woła Gemini', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody),
      makeEnv(false),
    )
    expect(response.status).toBe(429)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('odrzuca za długi tekst (413)', async () => {
    const body = { ...validBody, text: 'a'.repeat(300_001) }
    const response = await worker.fetch(
      request('POST', allowedOrigin, body),
      makeEnv(),
    )
    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({
      error: 'Dokument jest za długi (limit 300 000 znaków).',
    })
  })

  it('odrzuca żądanie bez wymaganych pól (400)', async () => {
    const response = await worker.fetch(
      request('POST', allowedOrigin, { text: 'abc' }),
      makeEnv(),
    )
    expect(response.status).toBe(400)
  })

  it('odrzuca pusty tekst bez skanów (400)', async () => {
    const response = await worker.fetch(
      request('POST', allowedOrigin, { ...validBody, text: '  ' }),
      makeEnv(),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Brak treści do analizy.' })
  })

  it('odrzuca obcy origin', async () => {
    const response = await worker.fetch(
      request('POST', 'https://evil.example', validBody),
      makeEnv(),
    )
    expect(response.status).toBe(403)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('odrzuca żądanie bez nagłówka Origin', async () => {
    const response = await worker.fetch(
      request('POST', null, validBody),
      makeEnv(),
    )
    expect(response.status).toBe(403)
  })

  it('obsługuje preflight OPTIONS', async () => {
    const response = await worker.fetch(
      request('OPTIONS', allowedOrigin),
      makeEnv(),
    )
    expect(response.status).toBe(204)
  })

  it('odrzuca metodę GET', async () => {
    const response = await worker.fetch(
      request('GET', allowedOrigin),
      makeEnv(),
    )
    expect(response.status).toBe(405)
  })

  it('zwraca 404 dla innej ścieżki', async () => {
    const response = await worker.fetch(
      request('POST', allowedOrigin, validBody, '/inne'),
      makeEnv(),
    )
    expect(response.status).toBe(404)
  })
})

describe('POST /analyze: długi dokument', () => {
  it('analizuje fragmenty równolegle i scala wynik z końcowym podsumowaniem', async () => {
    // 3 strony po ok. 25 000 znaków: każda w osobnym fragmencie (limit 40 000),
    // czyli 3 wywołania na fragmenty + 1 na końcowe podsumowanie
    const longPage = (number: number, fact: string) =>
      `[Strona ${number}]\n${fact}\n${'x '.repeat(12_500)}`
    const text = [
      longPage(1, 'Wynagrodzenie: 12 500,00 zł'),
      longPage(2, 'Kara umowna: 1 000,00 zł'),
      longPage(3, 'Postanowienia końcowe'),
    ].join('\n\n')

    const part = (organization: string, amounts: ModelOutput['amounts']) =>
      JSON.stringify({
        ...modelOutput,
        entities: { organizations: [organization], people: [] },
        amounts,
      })
    const fetchMock = mockGemini(
      part('ACME sp. z o.o.', [modelOutput.amounts[0]]),
      part('Bank XYZ', [
        { value: 1000, currency: 'PLN', context: 'Kara', source: 'text' },
      ]),
      part('ACME sp. z o.o.', []),
      JSON.stringify({
        summary: 'Podsumowanie całości.',
        keyPoints: ['Pierwszy', 'Drugi', 'Trzeci'],
      }),
    )

    const response = await worker.fetch(
      request('POST', allowedOrigin, { ...validBody, text }),
      makeEnv(),
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    const result = analysisResultSchema.parse(await response.json())
    expect(result.summary).toBe('Podsumowanie całości.')
    expect(result.entities.organizations).toEqual([
      'ACME sp. z o.o.',
      'Bank XYZ',
    ])
    expect(result.amounts.map((amount) => amount.value)).toEqual([12500, 1000])

    // Ostatnie wywołanie to podsumowanie z podsumowań fragmentów
    const lastBody = String(fetchMock.mock.calls[3][1]?.body)
    expect(lastBody).toContain('Combine the partial analyses')
  })
})
