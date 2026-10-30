import { describe, expect, it } from 'vitest'
import type { ModelOutput } from '../../web/src/lib/schema'
import { mergeChunkResults } from '../src/merge'

function output(overrides: Partial<ModelOutput>): ModelOutput {
  return {
    document: { language: 'pl', type: 'umowa', title: null, date: null },
    summary: 'Fragment.',
    keyPoints: ['a', 'b', 'c'],
    entities: { organizations: [], people: [] },
    amounts: [],
    dates: [],
    keywords: [],
    ...overrides,
  }
}

describe('mergeChunkResults', () => {
  it('łączy podmioty i słowa kluczowe bez duplikatów (wielkość liter, spacje)', () => {
    const merged = mergeChunkResults([
      output({
        entities: {
          organizations: ['ACME sp. z o.o.'],
          people: ['Jan Kowalski'],
        },
        keywords: ['umowa', 'Kraków'],
      }),
      output({
        entities: {
          organizations: ['acme  sp. z o.o.', 'Bank XYZ'],
          people: ['Jan Kowalski', 'Anna Nowak'],
        },
        keywords: ['UMOWA', 'aneks'],
      }),
    ])

    expect(merged.entities).toEqual({
      organizations: ['ACME sp. z o.o.', 'Bank XYZ'],
      people: ['Jan Kowalski', 'Anna Nowak'],
    })
    expect(merged.keywords).toEqual(['umowa', 'Kraków', 'aneks'])
  })

  it('usuwa powtórzone kwoty (wartość + waluta) i daty', () => {
    const amount = {
      value: 12500,
      currency: 'PLN',
      context: 'Wynagrodzenie',
      source: 'text' as const,
    }
    const merged = mergeChunkResults([
      output({
        amounts: [amount],
        dates: [{ date: '2026-03-14', context: 'Zawarcie umowy' }],
      }),
      output({
        amounts: [
          { ...amount, context: 'Wynagrodzenie brutto' },
          { ...amount, currency: 'EUR' },
        ],
        dates: [
          { date: '2026-03-14', context: 'Data umowy' },
          { date: '2026-04-30', context: 'Termin' },
        ],
      }),
    ])

    expect(merged.amounts).toEqual([amount, { ...amount, currency: 'EUR' }])
    expect(merged.dates.map((date) => date.date)).toEqual([
      '2026-03-14',
      '2026-04-30',
    ])
  })

  it('bierze tytuł i datę z pierwszego fragmentu, który je ma', () => {
    const merged = mergeChunkResults([
      output({
        document: { language: 'pl', type: 'umowa', title: null, date: null },
      }),
      output({
        document: {
          language: 'pl',
          type: 'umowa',
          title: 'Umowa nr 14',
          date: '2026-03-14',
        },
      }),
    ])
    expect(merged.document.title).toBe('Umowa nr 14')
    expect(merged.document.date).toBe('2026-03-14')
  })

  it('typ: najczęstszy konkretny, "inne" tylko gdy nic innego nie rozpoznano', () => {
    const doc = (type: ModelOutput['document']['type']) =>
      output({ document: { language: 'pl', type, title: null, date: null } })

    expect(
      mergeChunkResults([doc('umowa'), doc('inne'), doc('inne')]).document.type,
    ).toBe('umowa')
    expect(mergeChunkResults([doc('inne'), doc('inne')]).document.type).toBe(
      'inne',
    )
  })

  it('język: najczęstszy wśród fragmentów', () => {
    const lang = (language: string) =>
      output({
        document: { language, type: 'umowa', title: null, date: null },
      })
    expect(
      mergeChunkResults([lang('en'), lang('pl'), lang('pl')]).document.language,
    ).toBe('pl')
  })
})
