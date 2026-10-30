import { documentTypeLabel, formatDateTime } from '../lib/format'
import type { HistoryEntry } from '../lib/history'

type Props = {
  entries: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
  onNew: () => void
}

export function HistoryView({ entries, onSelect, onClear, onNew }: Props) {
  return (
    <main className="layout">
      <aside className="margin" aria-label="O historii">
        <section className="margin-note">
          <h2>Historia</h2>
          <p>
            Ostatnie 10 analiz. Zapisane tylko w tej przeglądarce, bez treści
            plików PDF.
          </p>
        </section>
      </aside>

      <article className="main">
        <h1 className="doc-title doc-title--solo">Historia analiz</h1>

        {entries.length === 0 ? (
          <>
            <p className="empty">Brak zapisanych analiz.</p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={onNew}>
                Przeanalizuj dokument
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="history-list">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="history-item"
                    onClick={() => onSelect(entry)}
                  >
                    <span className="history-date">
                      {formatDateTime(entry.savedAt)}
                    </span>
                    <span className="history-name">
                      <span className="history-title">
                        {entry.result.document.title ??
                          entry.result.document.fileName}
                      </span>
                      <span className="history-file">
                        {entry.result.document.fileName}
                      </span>
                    </span>
                    <span className="tag">
                      {documentTypeLabel(entry.result.document.type)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClear}
              >
                Wyczyść historię
              </button>
            </div>
          </>
        )}
      </article>
    </main>
  )
}
