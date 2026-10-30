import type { ReactNode } from 'react'

export type View = 'analysis' | 'history'

type Props = {
  view: View
  onNavigate: (view: View) => void
  children: ReactNode
}

// Pasek górny z nawigacją. Widoki przełączamy stanem, bez routera.
export function AppShell({ view, onNavigate, children }: Props) {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">PDF Insight</div>
        <nav className="nav" aria-label="Główna">
          <button
            type="button"
            aria-current={view === 'analysis' ? 'page' : undefined}
            onClick={() => onNavigate('analysis')}
          >
            Nowa analiza
          </button>
          <button
            type="button"
            aria-current={view === 'history' ? 'page' : undefined}
            onClick={() => onNavigate('history')}
          >
            Historia
          </button>
        </nav>
      </header>
      {children}
    </div>
  )
}
