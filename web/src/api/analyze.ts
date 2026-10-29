import { analysisResultSchema, type AnalysisResult } from '../lib/schema'

// To, co przeglądarka wysyła do Workera. Sam plik PDF nigdy nie wychodzi z przeglądarki.
export type AnalyzeRequest = {
  fileName: string
  pages: number
  text: string
  skippedPages: number[]
}

export async function analyze(input: AnalyzeRequest): Promise<AnalysisResult> {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) {
    throw new Error('Brak adresu serwera (VITE_API_URL).')
  }

  let response: Response
  try {
    response = await fetch(`${apiUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new Error('Nie udało się połączyć z serwerem.')
  }

  if (!response.ok) {
    throw new Error(`Serwer zwrócił błąd (${response.status}).`)
  }

  const parsed = analysisResultSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error('Odpowiedź serwera ma niepoprawny format.')
  }
  return parsed.data
}
