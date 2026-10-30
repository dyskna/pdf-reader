import { describe, expect, it } from 'vitest'
import {
  addEntry,
  HISTORY_LIMIT,
  loadHistory,
  saveHistory,
  STORAGE_KEY,
} from './history'
import type { AnalysisResult } from './schema'

// Prosty zamiennik localStorage oparty na Map
function memoryStorage(initial?: string) {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(STORAGE_KEY, initial)
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

// Storage, który zawsze rzuca wyjątek (np. tryb prywatny, brak miejsca)
const brokenStorage = {
  getItem: (): string | null => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

function result(fileName: string): AnalysisResult {
  return {
    document: {
      fileName,
      pages: 1,
      language: 'pl',
      type: 'umowa',
      title: null,
      date: null,
    },
    summary: 'Podsumowanie.',
    keyPoints: ['a', 'b', 'c'],
    entities: { organizations: [], people: [] },
    amounts: [],
    dates: [],
    keywords: [],
    skippedPages: [],
  }
}

describe('historia analiz', () => {
  it('pusta historia, gdy nic nie zapisano', () => {
    expect(loadHistory(memoryStorage())).toEqual([])
  })

  it('zapisuje wynik i odczytuje go po „odświeżeniu”', () => {
    const storage = memoryStorage()
    const entries = addEntry([], result('umowa.pdf'))
    saveHistory(entries, storage)

    expect(loadHistory(storage)).toEqual(entries)
  })

  it('najnowszy wpis jest na górze, a lista ma najwyżej 10 pozycji', () => {
    let entries = addEntry([], result('plik-1.pdf'))
    for (let i = 2; i <= HISTORY_LIMIT + 2; i++) {
      entries = addEntry(entries, result(`plik-${i}.pdf`))
    }

    expect(entries).toHaveLength(HISTORY_LIMIT)
    expect(entries[0].result.document.fileName).toBe('plik-12.pdf')
    expect(entries[9].result.document.fileName).toBe('plik-3.pdf')
  })

  it('uszkodzony JSON daje pustą historię', () => {
    expect(loadHistory(memoryStorage('{to nie jest json'))).toEqual([])
  })

  it('pomija niepoprawne wpisy, a poprawne zostawia', () => {
    const [valid] = addEntry([], result('dobry.pdf'))
    const storage = memoryStorage(
      JSON.stringify([valid, { id: 1, result: 'zły' }]),
    )
    expect(loadHistory(storage)).toEqual([valid])
  })

  it('działa bez dostępu do storage (wyjątki są przechwytywane)', () => {
    expect(loadHistory(brokenStorage)).toEqual([])
    expect(() =>
      saveHistory(addEntry([], result('a.pdf')), brokenStorage),
    ).not.toThrow()
  })

  it('zapis pustej listy czyści historię', () => {
    const storage = memoryStorage()
    saveHistory(addEntry([], result('umowa.pdf')), storage)
    saveHistory([], storage)
    expect(loadHistory(storage)).toEqual([])
  })
})
