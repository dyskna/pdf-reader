export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// Zwraca komunikat błędu po polsku albo null, gdy plik jest w porządku.
export function validateFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
): string | null {
  // Niektóre systemy nie podają typu MIME, więc sprawdzamy też rozszerzenie
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return 'To nie jest plik PDF. Wybierz plik z rozszerzeniem .pdf.'
  }
  if (file.size === 0) {
    return 'Plik jest pusty.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Plik jest za duży. Maksymalny rozmiar to 10 MB.'
  }
  return null
}
