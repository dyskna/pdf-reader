import { ErrorNotice } from './ErrorNotice'

type Props = {
  fileName: string
  message: string
  onRetry: () => void
  onNew: () => void
}

// Błąd w trakcie odczytu lub analizy pliku (np. przeciążony serwer)
export function ErrorScreen({ fileName, message, onRetry, onNew }: Props) {
  return (
    <main className="layout">
      <aside className="margin" aria-label="Dane pliku">
        <span className="doc-type">Błąd</span>
      </aside>

      <article className="main">
        <p className="file-name">{fileName}</p>
        <h1 className="doc-title">Analiza nie powiodła się</h1>
        <ErrorNotice message={message} />
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Spróbuj ponownie
          </button>
          <button type="button" className="btn btn-secondary" onClick={onNew}>
            Wybierz inny plik
          </button>
        </div>
      </article>
    </main>
  )
}
