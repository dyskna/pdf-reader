import { describe, expect, it } from 'vitest'
import { analysisResultSchema, modelOutputSchema } from './schema'

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
  amounts: [
    { value: 5000, currency: 'PLN', context: 'Wynagrodzenie', source: 'text' },
  ],
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

  it('odrzuca wynik bez całej sekcji entities', () => {
    const result = { ...validResult, entities: undefined }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })

  it('odrzuca złe typy (liczba stron jako tekst, kwota jako tekst)', () => {
    const pagesAsText = {
      ...validResult,
      document: { ...validResult.document, pages: '2' },
    }
    const amountAsText = {
      ...validResult,
      amounts: [{ ...validResult.amounts[0], value: '5000' }],
    }
    expect(analysisResultSchema.safeParse(pagesAsText).success).toBe(false)
    expect(analysisResultSchema.safeParse(amountAsText).success).toBe(false)
  })

  it('odrzuca nieznany typ dokumentu', () => {
    const result = {
      ...validResult,
      document: { ...validResult.document, type: 'list' },
    }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })

  it.each(['13.04.2026', '2026-13-01', '2026-02-30', '2026-04-13T10:00'])(
    'odrzuca datę spoza formatu ISO 8601: %s',
    (date) => {
      const result = { ...validResult, dates: [{ date, context: 'Termin' }] }
      expect(analysisResultSchema.safeParse(result).success).toBe(false)
    },
  )

  it.each(['zł', 'pln', 'PLNN', ''])('odrzuca złą walutę: "%s"', (currency) => {
    const result = {
      ...validResult,
      amounts: [{ ...validResult.amounts[0], currency }],
    }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })

  it('odrzuca kwotę bez źródła (text/ocr)', () => {
    const result = {
      ...validResult,
      amounts: [{ value: 5000, currency: 'PLN', context: 'Wynagrodzenie' }],
    }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })

  it('przyjmuje null w polach, których brak w dokumencie', () => {
    const result = {
      ...validResult,
      document: { ...validResult.document, title: null, date: null },
    }
    expect(analysisResultSchema.safeParse(result).success).toBe(true)
  })

  it('odrzuca mniej niż 3 kluczowe punkty', () => {
    const result = { ...validResult, keyPoints: ['jeden', 'dwa'] }
    expect(analysisResultSchema.safeParse(result).success).toBe(false)
  })
})

describe('modelOutputSchema', () => {
  it('nie wymaga pól, które podaje przeglądarka', () => {
    const output = {
      ...validResult,
      document: {
        language: 'pl',
        type: 'umowa',
        title: 'Umowa o dzieło',
        date: '2026-03-14',
      },
      skippedPages: undefined,
    }
    expect(modelOutputSchema.safeParse(output).success).toBe(true)
  })
})
