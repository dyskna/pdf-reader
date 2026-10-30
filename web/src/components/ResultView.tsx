import {
  currencyLabel,
  documentTypeLabel,
  formatAmount,
  formatDate,
  formatSkippedPages,
  languageName,
} from '../lib/format'
import type { AnalysisResult } from '../lib/schema'

type Props = {
  result: AnalysisResult
  onNew: () => void
}

// Ekran wyniku według design/export/3a/index.html
export function ResultView({ result, onNew }: Props) {
  const { document, skippedPages } = result

  return (
    <main className="layout">
      <aside className="margin" aria-label="Dane dokumentu">
        <span className="doc-type">{documentTypeLabel(document.type)}</span>
        <dl className="meta">
          <div>
            <dt>Data dokumentu</dt>
            <dd>
              {document.date ? (
                <time dateTime={document.date}>
                  {formatDate(document.date)}
                </time>
              ) : (
                'brak'
              )}
            </dd>
          </div>
          <div>
            <dt>Stron</dt>
            <dd>{document.pages}</dd>
          </div>
          <div>
            <dt>Język</dt>
            <dd>{languageName(document.language)}</dd>
          </div>
          <div>
            <dt>Pominięto</dt>
            <dd>{formatSkippedPages(skippedPages)}</dd>
          </div>
        </dl>
      </aside>

      <article className="main">
        <p className="file-name">{document.fileName}</p>
        <h1 className="doc-title">{document.title ?? document.fileName}</h1>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onNew}>
            Analizuj inny plik
          </button>
        </div>

        {skippedPages.length > 0 && (
          <p className="notice" role="status">
            {skippedPages.length === 1
              ? `Strona ${skippedPages[0]} nie została przeanalizowana, wyniki mogą być niepełne.`
              : `Strony ${skippedPages.join(', ')} nie zostały przeanalizowane, wyniki mogą być niepełne.`}
          </p>
        )}

        <section
          className="section section--primary"
          aria-labelledby="h-summary"
        >
          <h2 className="section-title" id="h-summary">
            Podsumowanie
          </h2>
          <p className="summary">{result.summary}</p>
        </section>

        <section className="section" aria-labelledby="h-amounts">
          <h2 className="section-title" id="h-amounts">
            Kwoty
          </h2>
          {result.amounts.length === 0 ? (
            <p className="empty">Nie znaleziono kwot.</p>
          ) : (
            <ul className="amounts">
              {result.amounts.map((amount, i) => (
                <li className="amount" key={i}>
                  <span className="amount-value">
                    {formatAmount(amount.value)}
                    <span className="amount-currency">
                      {currencyLabel(amount.currency)}
                    </span>
                  </span>
                  <span>{amount.context}</span>
                  <span className="tag">
                    {amount.source === 'ocr' ? 'ze skanu (OCR)' : 'z tekstu'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="section" aria-labelledby="h-dates">
          <h2 className="section-title" id="h-dates">
            Daty
          </h2>
          {result.dates.length === 0 ? (
            <p className="empty">Nie znaleziono dat.</p>
          ) : (
            <ol className="dates">
              {result.dates.map((date, i) => (
                <li className="date" key={i}>
                  <time dateTime={date.date}>{formatDate(date.date)}</time>
                  <span>{date.context}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <details className="section json">
          <summary>Pokaż surowy JSON</summary>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </details>
      </article>
    </main>
  )
}
