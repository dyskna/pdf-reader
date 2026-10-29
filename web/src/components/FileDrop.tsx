import { useState, type ChangeEvent, type DragEvent } from 'react'

type Props = {
  onFile: (file: File) => void
}

// Strefa „przeciągnij i upuść” z polem wyboru pliku. Pole input zostaje widoczne,
// więc działa też z klawiatury (Tab + Enter/Spacja).
export function FileDrop({ onFile }: Props) {
  const [isDragging, setIsDragging] = useState(false)

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    // Bez preventDefault przeglądarka otworzyłaby plik zamiast go upuścić
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
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
    <label
      className={isDragging ? 'drop-zone is-dragging' : 'drop-zone'}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <span>Przeciągnij tutaj plik PDF albo wybierz go z dysku</span>
      <span className="hint">Tylko PDF, maksymalnie 10 MB</span>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleChange}
      />
    </label>
  )
}
