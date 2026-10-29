import { describe, expect, it } from 'vitest'
import { analysisResultSchema } from '../../web/src/lib/schema'
import worker from '../src/index'

const allowedOrigin = 'https://dyskna.github.io'
const env: Env = { ALLOWED_ORIGIN: allowedOrigin }

function request(method: string, origin: string | null, path = '/analyze') {
  const headers = origin ? { Origin: origin } : undefined
  return new Request(`https://worker.test${path}`, { method, headers })
}

describe('POST /analyze', () => {
  it('z dozwolonego originu zwraca wynik zgodny ze schematem', async () => {
    const response = await worker.fetch(request('POST', allowedOrigin), env)

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      allowedOrigin,
    )
    const body: unknown = await response.json()
    expect(analysisResultSchema.safeParse(body).success).toBe(true)
  })

  it('odrzuca obcy origin', async () => {
    const response = await worker.fetch(
      request('POST', 'https://evil.example'),
      env,
    )
    expect(response.status).toBe(403)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('odrzuca żądanie bez nagłówka Origin', async () => {
    const response = await worker.fetch(request('POST', null), env)
    expect(response.status).toBe(403)
  })

  it('obsługuje preflight OPTIONS', async () => {
    const response = await worker.fetch(request('OPTIONS', allowedOrigin), env)
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
      'POST',
    )
  })

  it('odrzuca metodę GET', async () => {
    const response = await worker.fetch(request('GET', allowedOrigin), env)
    expect(response.status).toBe(405)
  })

  it('zwraca 404 dla innej ścieżki', async () => {
    const response = await worker.fetch(
      request('POST', allowedOrigin, '/inne'),
      env,
    )
    expect(response.status).toBe(404)
  })
})
