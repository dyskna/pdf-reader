import { useEffect, useState } from 'react'
import {
  addEntry,
  loadHistory,
  saveHistory,
  type HistoryEntry,
} from '../lib/history'
import type { AnalysisResult } from '../lib/schema'

export function useHistory() {
  // Funkcja w useState: odczyt z localStorage tylko przy pierwszym renderze
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory())

  // Każda zmiana listy trafia do localStorage (wyczyszczenie zapisuje pustą listę)
  useEffect(() => {
    saveHistory(entries)
  }, [entries])

  return {
    entries,
    add: (result: AnalysisResult) =>
      setEntries((current) => addEntry(current, result)),
    clear: () => setEntries([]),
  }
}
