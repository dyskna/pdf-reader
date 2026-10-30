import { describe, expect, it } from 'vitest'
import {
  analysisReducer,
  initialState,
  type AnalysisState,
} from './analysisState'
import type { PdfContent } from './pdf/readPdf'
import type { AnalysisResult } from './schema'

const file = new File(['%PDF-'], 'umowa.pdf', { type: 'application/pdf' })

const pdf: PdfContent = {
  pages: 2,
  pageTexts: [
    { page: 1, text: 'Umowa o dzieło' },
    { page: 2, text: '' },
  ],
  scanPages: [2],
}

const result: AnalysisResult = {
  document: {
    fileName: 'umowa.pdf',
    pages: 1,
    language: 'pl',
    type: 'umowa',
    title: null,
    date: null,
  },
  summary: 'Krótkie podsumowanie.',
  keyPoints: ['a', 'b', 'c'],
  entities: { organizations: [], people: [] },
  amounts: [],
  dates: [],
  keywords: [],
  skippedPages: [],
}

describe('analysisReducer', () => {
  it('bez skanów: odczyt › analiza › wynik', () => {
    let state = analysisReducer(initialState, { type: 'started', file })
    expect(state).toEqual({ status: 'reading', file })

    state = analysisReducer(state, { type: 'analysisStarted' })
    expect(state).toEqual({ status: 'analyzing', file })

    state = analysisReducer(state, { type: 'succeeded', result })
    expect(state).toEqual({ status: 'success', file, result })
  })

  it('ze skanami: odczyt › pytanie o zgodę › analiza', () => {
    let state = analysisReducer(initialState, { type: 'started', file })

    state = analysisReducer(state, { type: 'scansFound', pdf })
    expect(state).toEqual({ status: 'askingConsent', file, pdf })

    state = analysisReducer(state, { type: 'analysisStarted' })
    expect(state).toEqual({ status: 'analyzing', file })
  })

  it('błąd w trakcie analizy zachowuje plik do ponowienia', () => {
    const analyzing: AnalysisState = { status: 'analyzing', file }
    const state = analysisReducer(analyzing, {
      type: 'failed',
      message: 'Błąd',
    })
    expect(state).toEqual({ status: 'error', file, message: 'Błąd' })
  })

  it('błąd przy pytaniu o zgodę też zachowuje plik', () => {
    const asking: AnalysisState = { status: 'askingConsent', file, pdf }
    const state = analysisReducer(asking, { type: 'failed', message: 'Błąd' })
    expect(state).toEqual({ status: 'error', file, message: 'Błąd' })
  })

  it('błąd walidacji (przed startem) nie ma pliku do ponowienia', () => {
    const state = analysisReducer(initialState, {
      type: 'failed',
      message: 'Plik jest pusty.',
    })
    expect(state).toEqual({
      status: 'error',
      file: null,
      message: 'Plik jest pusty.',
    })
  })

  it('ignoruje zdarzenie z niewłaściwego etapu', () => {
    expect(analysisReducer(initialState, { type: 'analysisStarted' })).toBe(
      initialState,
    )
    expect(analysisReducer(initialState, { type: 'scansFound', pdf })).toBe(
      initialState,
    )
  })
})
