import { useState } from 'react'
import { FileDrop } from './components/FileDrop'
import { HistoryList } from './components/HistoryList'
import { ResultPreview } from './components/ResultPreview'
import { ScanConsent } from './components/ScanConsent'
import { ErrorMessage, LoadingStatus } from './components/StatusView'
import { useHistory } from './hooks/useHistory'
import { usePdfAnalysis } from './hooks/usePdfAnalysis'
import type { HistoryEntry } from './lib/history'

// Interfejs roboczy. Wygląd przyjdzie w etapie 5.
export default function App() {
  const history = useHistory()
  const { state, analyzeFile, retry, sendScans, skipScans } = usePdfAnalysis(
    history.add,
  )
  // Wynik otwarty z historii; nowa analiza go zamyka
  const [selected, setSelected] = useState<HistoryEntry | null>(null)

  function handleFile(file: File) {
    setSelected(null)
    void analyzeFile(file)
  }

  const shownResult =
    selected?.result ?? (state.status === 'success' ? state.result : null)

  return (
    <main>
      <h1>PDF Insight</h1>

      {state.status === 'reading' || state.status === 'analyzing' ? (
        <LoadingStatus stage={state.status} />
      ) : state.status === 'askingConsent' ? (
        <ScanConsent
          scanPages={state.pdf.scanPages}
          onSend={sendScans}
          onSkip={skipScans}
        />
      ) : (
        <FileDrop onFile={handleFile} />
      )}

      {state.status === 'error' && !selected && (
        <ErrorMessage
          message={state.message}
          onRetry={state.file ? retry : undefined}
        />
      )}
      {shownResult && <ResultPreview result={shownResult} />}

      <HistoryList
        entries={history.entries}
        onSelect={setSelected}
        onClear={() => {
          setSelected(null)
          history.clear()
        }}
      />
    </main>
  )
}
