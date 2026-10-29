import { describe, expect, it } from 'vitest'
import {
  analysisReducer,
  initialState,
  type AnalysisState,
} from './analysisState'
import type { AnalysisResult } from './schema'

const file = new File(['%PDF-'], 'umowa.pdf', { type: 'application/pdf' })

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
  it('przechodzi przez wszystkie etapy do wyniku', () => {
    let state = analysisReducer(initialState, { type: 'started', file })
    expect(state).toEqual({ status: 'reading', file })

    state = analysisReducer(state, { type: 'textRead' })
    expect(state).toEqual({ status: 'analyzing', file })

    state = analysisReducer(state, { type: 'succeeded', result })
    expect(state).toEqual({ status: 'success', file, result })
  })

  it('błąd w trakcie analizy zachowuje plik do ponowienia', () => {
    const analyzing: AnalysisState = { status: 'analyzing', file }
    const state = analysisReducer(analyzing, {
      type: 'failed',
      message: 'Błąd',
    })
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
    expect(analysisReducer(initialState, { type: 'textRead' })).toBe(
      initialState,
    )
  })
})
