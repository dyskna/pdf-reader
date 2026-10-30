import { useState, type ChangeEvent, type DragEvent } from 'react'
import { ErrorNotice } from './ErrorNotice'

type Props = {
  onFile: (file: File) => void
  error?: string // błąd walidacji poprzedniego pliku
}

export function UploadScreen({ onFile, error }: Props) {
  const [isDragging, setIsDragging] = useState(false)

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    // Bez preventDefault przeglądarka otworzyłaby plik zamiast go upuścić
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // dragleave przychodzi też przy wejściu na przycisk w środku strefy; ignorujemy go
    const target = event.relatedTarget
    if (target instanceof Node && event.currentTarget.contains(target)) return
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    // Czyścimy pole, żeby ten sam plik można było wybrać ponownie
    event.target.value = ''
  }

  return (
    <main className="layout">
      <aside className="margin" aria-label="Prywatność">
        <section className="margin-note">
          <h2>Co wysyłamy</h2>
          <ul>
            <li>
              Do analizy trafia tylko <strong>tekst</strong> dokumentu, do
              zewnętrznego API AI (Google Gemini).
            </li>
            <li>
              Obrazy stron-skanów wysyłamy wyłącznie po Twojej osobnej zgodzie.
            </li>
            <li>Plik PDF nie opuszcza Twojej przeglądarki.</li>
          </ul>
        </section>
        <section className="margin-note">
          <h2>Wersja demonstracyjna</h2>
          <p>
            Korzysta z darmowego API. Nie wgrywaj dokumentów z danymi
            wrażliwymi.
          </p>
        </section>
      </aside>

      <article className="main">
        <h1 className="doc-title doc-title--solo">Przeanalizuj dokument PDF</h1>
        <p className="lead">
          Dostaniesz krótkie podsumowanie, kluczowe kwoty i daty oraz dane w
          formacie JSON.
        </p>

        {error && <ErrorNotice message={error} />}

        <div
          className={isDragging ? 'dropzone is-dragging' : 'dropzone'}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="dropzone-title">Przeciągnij tutaj plik PDF</p>
          <input
            id="pdf-file"
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleChange}
          />
          <label htmlFor="pdf-file" className="btn btn-primary">
            Wybierz plik z dysku
          </label>
          <p className="dropzone-hint">Tylko PDF, maksymalnie 10 MB.</p>
        </div>
      </article>
    </main>
  )
}
