import type { PdfContent } from './pdf/readPdf'
import type { AnalysisResult } from './schema'

// Stany ekranu: pusty › Odczyt PDF › (pytanie o skany) › Analiza AI › wynik albo błąd.
// Plik zostaje w stanie, żeby „Spróbuj ponownie” mogło użyć go jeszcze raz.
export type AnalysisState =
  | { status: 'idle' }
  | { status: 'reading'; file: File }
  | { status: 'askingConsent'; file: File; pdf: PdfContent }
  | { status: 'analyzing'; file: File }
  | { status: 'success'; file: File; result: AnalysisResult }
  | { status: 'error'; file: File | null; message: string }

export type AnalysisAction =
  | { type: 'started'; file: File }
  | { type: 'scansFound'; pdf: PdfContent }
  | { type: 'analysisStarted' }
  | { type: 'succeeded'; result: AnalysisResult }
  | { type: 'failed'; message: string }
  | { type: 'reset' }

export const initialState: AnalysisState = { status: 'idle' }

export function analysisReducer(
  state: AnalysisState,
  action: AnalysisAction,
): AnalysisState {
  switch (action.type) {
    case 'started':
      return { status: 'reading', file: action.file }

    // „Analizuj inny plik” / „Nowa analiza”: powrót do pustego ekranu
    case 'reset':
      return initialState

    case 'scansFound':
      if (state.status !== 'reading') return state
      return { status: 'askingConsent', file: state.file, pdf: action.pdf }

    case 'analysisStarted':
      if (state.status !== 'reading' && state.status !== 'askingConsent') {
        return state
      }
      return { status: 'analyzing', file: state.file }

    case 'succeeded':
      if (state.status !== 'analyzing') return state
      return { status: 'success', file: state.file, result: action.result }

    case 'failed': {
      // Błąd w trakcie pracy nad plikiem: pozwalamy ponowić. Błąd walidacji: nie ma czego ponawiać.
      const isWorking =
        state.status === 'reading' ||
        state.status === 'askingConsent' ||
        state.status === 'analyzing'
      return {
        status: 'error',
        file: isWorking ? state.file : null,
        message: action.message,
      }
    }
  }
}
