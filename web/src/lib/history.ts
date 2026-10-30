import { z } from 'zod'
import { analysisResultSchema, type AnalysisResult } from './schema'

// Historia ostatnich analiz w localStorage. Zapisujemy wynik (podsumowanie, kwoty, podmioty),
// nigdy tekst ani plik PDF. Przy zmianie kształtu danych podbijamy wersję w kluczu.
export const STORAGE_KEY = 'pdf-insight:history:v1'
export const HISTORY_LIMIT = 10

const historyEntrySchema = z.object({
  id: z.string(),
  savedAt: z.iso.datetime(),
  result: analysisResultSchema,
})

export type HistoryEntry = z.infer<typeof historyEntrySchema>

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

// Samo odwołanie do localStorage potrafi rzucić wyjątek (tryb prywatny, zablokowane dane strony).
// Wtedy historia działa tylko w pamięci, do odświeżenia strony.
function getStorage(): KeyValueStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadHistory(storage = getStorage()): HistoryEntry[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    // Uszkodzone albo stare wpisy pomijamy pojedynczo, reszta zostaje
    return data.flatMap((item) => {
      const parsed = historyEntrySchema.safeParse(item)
      return parsed.success ? [parsed.data] : []
    })
  } catch {
    return []
  }
}

export function saveHistory(entries: HistoryEntry[], storage = getStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Brak miejsca albo zablokowany zapis: historia zostaje w pamięci
  }
}

// Nowy wynik na początku listy, najwyżej HISTORY_LIMIT wpisów. Nie zapisuje do storage.
export function addEntry(
  entries: HistoryEntry[],
  result: AnalysisResult,
): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    result,
  }
  return [entry, ...entries].slice(0, HISTORY_LIMIT)
}
