import { formatSkippedPages } from '../lib/format'
import { MAX_SCANS } from '../lib/pdf/limits'

type Props = {
  fileName: string
  pages: number
  scanPages: number[]
  onSend: () => void
  onSkip: () => void
}

// Pytanie o zgodę na wysłanie obrazów stron-skanów do AI (OCR)
export function ScanConsent({
  fileName,
  pages,
  scanPages,
  onSend,
  onSkip,
}: Props) {
  const list = scanPages.join(', ')
  const question =
    scanPages.length === 1
      ? `Strona ${list} to skan bez tekstu. Wysłać jej obraz do AI, żeby go odczytać?`
      : `Strony ${list} to skany bez tekstu. Wysłać ich obrazy do AI, żeby je odczytać?`

  return (
    <main className="layout">
      <aside className="margin" aria-label="Dane pliku">
        <span className="doc-type">Wymaga decyzji</span>
        <dl className="meta">
          <div>
            <dt>Stron</dt>
            <dd>{pages}</dd>
          </div>
          <div>
            <dt>Skany bez tekstu</dt>
            <dd>{formatSkippedPages(scanPages)}</dd>
          </div>
        </dl>
      </aside>

      <article className="main">
        <p className="file-name">{fileName}</p>
        <h1 className="doc-title" id="consent-title">
          Znaleźliśmy skany
        </h1>
        <section
          className="section section--primary"
          aria-labelledby="consent-title"
        >
          <p className="summary">{question}</p>
          <p className="dropzone-hint">
            Obraz strony trafi do Google Gemini tylko po to, żeby odczytać z
            niego tekst. Jeśli pominiesz, analiza obejmie resztę dokumentu.
          </p>
          {scanPages.length > MAX_SCANS && (
            <p className="notice">
              Wysłanych zostanie pierwszych {MAX_SCANS} stron, pozostałe zostaną
              pominięte.
            </p>
          )}
        </section>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onSend}>
            Wyślij
          </button>
          <button type="button" className="btn btn-secondary" onClick={onSkip}>
            Pomiń
          </button>
        </div>
      </article>
    </main>
  )
}
