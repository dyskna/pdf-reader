// Limit stron-skanów w jednym żądaniu; tyle samo co w Workerze (worker/src/request.ts).
// Osobny plik bez importu pdf.js, żeby ekrany mogły go używać bez ładowania biblioteki.
export const MAX_SCANS = 10
