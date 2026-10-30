import { useState } from 'react'
import { AppShell, type View } from './components/AppShell'
import { ErrorScreen } from './components/ErrorScreen'
import { HistoryView } from './components/HistoryView'
import { ProgressScreen } from './components/ProgressScreen'
import { ResultView } from './components/ResultView'
import { ScanConsent } from './components/ScanConsent'
import { UploadScreen } from './components/UploadScreen'
import { useHistory } from './hooks/useHistory'
import { usePdfAnalysis } from './hooks/usePdfAnalysis'
import type { HistoryEntry } from './lib/history'

export default function App() {
  const history = useHistory()
  const analysis = usePdfAnalysis(history.add)
  const { state } = analysis
  const [view, setView] = useState<View>('analysis')
  // Wynik otwarty z historii
  const [selected, setSelected] = useState<HistoryEntry | null>(null)

  function startNew() {
    setSelected(null)
    setView('analysis')
    analysis.reset()
  }

  function navigate(next: View) {
    if (next === 'analysis') startNew()
    else {
      setSelected(null)
      setView('history')
    }
  }

  function openFromHistory(entry: HistoryEntry) {
    setSelected(entry)
    setView('analysis')
  }

  function renderScreen() {
    if (selected)
      return <ResultView result={selected.result} onNew={startNew} />

    if (view === 'history') {
      return (
        <HistoryView
          entries={history.entries}
          onSelect={openFromHistory}
          onClear={history.clear}
          onNew={startNew}
        />
      )
    }

    switch (state.status) {
      case 'idle':
        return <UploadScreen onFile={analysis.analyzeFile} />
      case 'reading':
      case 'analyzing':
        return <ProgressScreen file={state.file} stage={state.status} />
      case 'askingConsent':
        return (
          <ScanConsent
            fileName={state.file.name}
            pages={state.pdf.pages}
            scanPages={state.pdf.scanPages}
            onSend={analysis.sendScans}
            onSkip={analysis.skipScans}
          />
        )
      case 'success':
        return <ResultView result={state.result} onNew={startNew} />
      case 'error':
        // Bez pliku to błąd walidacji: zostajemy przy wyborze pliku
        return state.file ? (
          <ErrorScreen
            fileName={state.file.name}
            message={state.message}
            onRetry={analysis.retry}
            onNew={startNew}
          />
        ) : (
          <UploadScreen onFile={analysis.analyzeFile} error={state.message} />
        )
    }
  }

  return (
    <AppShell view={selected ? 'analysis' : view} onNavigate={navigate}>
      {renderScreen()}
    </AppShell>
  )
}
