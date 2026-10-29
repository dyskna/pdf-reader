import { FileDrop } from './components/FileDrop'
import { ResultPreview } from './components/ResultPreview'
import { ErrorMessage, LoadingStatus } from './components/StatusView'
import { usePdfAnalysis } from './hooks/usePdfAnalysis'

// Interfejs roboczy z etapu 2. Wygląd przyjdzie w etapie 5.
export default function App() {
  const { state, analyzeFile, retry } = usePdfAnalysis()

  return (
    <main>
      <h1>PDF Insight</h1>

      {state.status === 'reading' || state.status === 'analyzing' ? (
        <LoadingStatus stage={state.status} />
      ) : (
        <FileDrop onFile={analyzeFile} />
      )}

      {state.status === 'error' && (
        <ErrorMessage
          message={state.message}
          onRetry={state.file ? retry : undefined}
        />
      )}
      {state.status === 'success' && <ResultPreview result={state.result} />}
    </main>
  )
}
