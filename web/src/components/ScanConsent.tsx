import { MAX_SCANS } from '../lib/pdf/renderScans'

type Props = {
  scanPages: number[]
  onSend: () => void
  onSkip: () => void
}

// Pytanie o zgodę na wysłanie obrazów stron-skanów do AI (OCR).
export function ScanConsent({ scanPages, onSend, onSkip }: Props) {
  const pages = scanPages.join(', ')
  const question =
    scanPages.length === 1
      ? `Strona ${pages} to skan bez tekstu. Wysłać jej obraz do AI, żeby go odczytać?`
      : `Strony ${pages} to skany bez tekstu. Wysłać ich obrazy do AI, żeby je odczytać?`

  return (
    <section className="consent" aria-labelledby="consent-question">
      <p id="consent-question">{question}</p>
      {scanPages.length > MAX_SCANS && (
        <p className="hint">
          Wysłanych zostanie pierwszych {MAX_SCANS} stron, pozostałe zostaną
          pominięte.
        </p>
      )}
      <div className="actions">
        <button type="button" onClick={onSend}>
          Wyślij
        </button>
        <button type="button" onClick={onSkip}>
          Pomiń
        </button>
      </div>
    </section>
  )
}
