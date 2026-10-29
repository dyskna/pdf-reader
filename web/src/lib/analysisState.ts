import type { AnalysisResult } from './schema'

// Stany ekranu: pusty › Odczyt PDF › Analiza AI › wynik albo błąd.
// Plik zostaje w stanie, żeby „Spróbuj ponownie” mogło użyć go jeszcze raz.
export type AnalysisState =
  | { status: 'idle' }
  | { status: 'reading'; file: File }
  | { status: 'analyzing'; file: File }
  | { status: 'success'; file: File; result: AnalysisResult }
  | { status: 'error'; file: File | null; message: string }

export type AnalysisAction =
  | { type: 'started'; file: File }
  | { type: 'textRead' }
  | { type: 'succeeded'; result: AnalysisResult }
  | { type: 'failed'; message: string }

export const initialState: AnalysisState = { status: 'idle' }

export function analysisReducer(
  state: AnalysisState,
  action: AnalysisAction,
): AnalysisState {
  switch (action.type) {
    case 'started':
      return { status: 'reading', file: action.file }

    case 'textRead':
      if (state.status !== 'reading') return state
      return { status: 'analyzing', file: state.file }

    case 'succeeded':
      if (state.status !== 'analyzing') return state
      return { status: 'success', file: state.file, result: action.result }

    case 'failed': {
      // Błąd w trakcie pracy nad plikiem: pozwalamy ponowić. Błąd walidacji: nie ma czego ponawiać.
      const isWorking =
        state.status === 'reading' || state.status === 'analyzing'
      return {
        status: 'error',
        file: isWorking ? state.file : null,
        message: action.message,
      }
    }
  }
}
