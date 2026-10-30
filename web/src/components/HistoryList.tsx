import type { HistoryEntry } from '../lib/history'

type Props = {
  entries: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
}

export function HistoryList({ entries, onSelect, onClear }: Props) {
  return (
    <section>
      <h2>Historia</h2>
      {entries.length === 0 ? (
        <p className="hint">Brak zapisanych analiz.</p>
      ) : (
        <>
          <ul className="history">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button type="button" onClick={() => onSelect(entry)}>
                  {entry.result.document.fileName} ·{' '}
                  {entry.result.document.type} ·{' '}
                  {new Date(entry.savedAt).toLocaleString('pl-PL')}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onClear}>
            Wyczyść historię
          </button>
        </>
      )}
      <p className="hint">
        Historia jest zapisana tylko w tej przeglądarce (bez treści PDF).
      </p>
    </section>
  )
}
