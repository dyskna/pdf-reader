type Stage = 'reading' | 'analyzing'

const stages: { key: Stage; label: string }[] = [
  { key: 'reading', label: 'Odczyt PDF' },
  { key: 'analyzing', label: 'Analiza AI' },
]

export function LoadingStatus({ stage }: { stage: Stage }) {
  return (
    <ol className="stages" aria-live="polite">
      {stages.map(({ key, label }) => (
        <li key={key} aria-current={key === stage ? 'step' : undefined}>
          {label}
          {key === stage && '…'}
        </li>
      ))}
    </ol>
  )
}

type ErrorProps = {
  message: string
  onRetry?: () => void // brak = nie ma czego ponawiać (np. zły typ pliku)
}

export function ErrorMessage({ message, onRetry }: ErrorProps) {
  return (
    <div role="alert" className="error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Spróbuj ponownie
        </button>
      )}
    </div>
  )
}
