import { describe, expect, it } from 'vitest'
import { analysisResultSchema } from './schema'

const validResult = {
  document: {
    fileName: 'umowa.pdf',
    pages: 2,
    language: 'pl',
    type: 'umowa',
    title: 'Umowa o dzieło',
    date: '2026-03-14',
  },
  summary: 'Umowa o wykonanie strony internetowej.',
  keyPoints: ['Termin: 30 dni', 'Wynagrodzenie: 5000 PLN', 'Kara umowna 10%'],
  entities: { organizations: ['ACME sp. z o.o.'], people: ['Jan Kowalski'] },
  amounts: [{ value: 5000, currency: 'PLN', context: 'Wynagrodzenie' }],
  dates: [{ date: '2026-04-13', context: 'Termin wykonania' }],
  keywords: ['umowa o dzieło', 'strona internetowa'],
  skippedPages: [],
}

describe('analysisResultSchema', () => {
  it('przyjmuje poprawny wynik', () => {
    expect(analysisResultSchema.safeParse(validResult).success).toBe(true)
  })

  it('odrzuca wynik bez summary', () => {
    const result = { ...validResult, summary: undefined }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })

  it('odrzuca datę spoza formatu ISO 8601', () => {
    const result = {
      ...validResult,
      dates: [{ date: '13.04.2026', context: 'Termin' }],
    }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })
})
