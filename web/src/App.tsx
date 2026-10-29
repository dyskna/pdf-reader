import { useState } from 'react'
import { analyze } from './api/analyze'
import type { AnalysisResult } from './lib/schema'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AnalysisResult }
  | { status: 'error'; message: string }

// Ekran roboczy z etapu 1: sprawdza tylko połączenie z Workerem.
export default function App() {
  const [state, setState] = useState<State>({ status: 'idle' })

  async function sendTestRequest() {
    setState({ status: 'loading' })
    try {
      const result = await analyze({
        fileName: 'przyklad.pdf',
        pages: 1,
        text: '[Strona 1]\nPrzykładowy tekst dokumentu.',
        skippedPages: [],
      })
      setState({ status: 'success', result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nieznany błąd.'
      setState({ status: 'error', message })
    }
  }

  return (
    <main>
      <h1>PDF Insight</h1>
      <p>Wersja robocza: test połączenia z serwerem.</p>
      <button
        type="button"
        onClick={sendTestRequest}
        disabled={state.status === 'loading'}
      >
        Wyślij testowe żądanie
      </button>
      {state.status === 'loading' && <p>Wysyłanie…</p>}
      {state.status === 'error' && <p role="alert">{state.message}</p>}
      {state.status === 'success' && (
        <pre>{JSON.stringify(state.result, null, 2)}</pre>
      )}
    </main>
  )
}
