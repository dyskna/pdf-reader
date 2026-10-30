import { formatFileSize } from '../lib/format'

type Stage = 'reading' | 'analyzing'

const stages: { key: Stage; label: string }[] = [
  { key: 'reading', label: 'Odczyt PDF' },
  { key: 'analyzing', label: 'Analiza AI' },
]

type Props = {
  file: File
  stage: Stage
}

export function ProgressScreen({ file, stage }: Props) {
  const currentIndex = stages.findIndex((s) => s.key === stage)

  return (
    <main className="layout">
      <aside className="margin" aria-label="Dane pliku">
        <span className="doc-type">W toku</span>
        <dl className="meta">
          <div>
            <dt>Plik</dt>
            <dd>{file.name}</dd>
          </div>
          <div>
            <dt>Rozmiar</dt>
            <dd>{formatFileSize(file.size)}</dd>
          </div>
        </dl>
      </aside>

      <article className="main">
        <p className="file-name">{file.name}</p>
        <h1 className="doc-title">Trwa analiza</h1>
        <ol className="steps" aria-live="polite">
          {stages.map(({ key, label }, i) => {
            const state =
              i < currentIndex
                ? 'done'
                : i === currentIndex
                  ? 'current'
                  : 'next'
            return (
              <li
                key={key}
                className={`step step--${state}`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className="step-marker" aria-hidden="true" />
                <span className="step-label">{label}</span>
                <span className="step-status">
                  {state === 'done'
                    ? 'gotowe'
                    : state === 'current'
                      ? 'w toku…'
                      : 'czeka'}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="dropzone-hint">
          Analiza zwykle trwa kilka sekund, przy długich dokumentach do 30
          sekund.
        </p>
      </article>
    </main>
  )
}
