import { useReducer } from 'react'
import { analyze } from '../api/analyze'
import { analysisReducer, initialState } from '../lib/analysisState'
import { buildDocumentText } from '../lib/pdf/pages'
import { MAX_SCANS } from '../lib/pdf/limits'
import type { PdfContent } from '../lib/pdf/readPdf'
import type { ScanImage } from '../lib/pdf/renderScans'
import { validateFile } from '../lib/pdf/validateFile'
import type { AnalysisResult } from '../lib/schema'

// Cała logika ekranu: walidacja › odczyt PDF › zgoda na skany › analiza.
// Komponenty tylko wyświetlają stan. onSuccess dostaje każdy udany wynik (np. do historii).
export function usePdfAnalysis(onSuccess: (result: AnalysisResult) => void) {
  const [state, dispatch] = useReducer(analysisReducer, initialState)

  function fail(error: unknown) {
    const message = error instanceof Error ? error.message : 'Nieznany błąd.'
    dispatch({ type: 'failed', message })
  }

  async function analyzeFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      dispatch({ type: 'failed', message: validationError })
      return
    }

    dispatch({ type: 'started', file })
    try {
      // pdf.js (ok. 500 kB) ładujemy dopiero przy pierwszym pliku, nie przy otwarciu strony
      const { readPdf } = await import('../lib/pdf/readPdf')
      const pdf = await readPdf(file)
      if (pdf.scanPages.length > 0) {
        // Czekamy na decyzję użytkownika: sendScans() albo skipScans()
        dispatch({ type: 'scansFound', pdf })
        return
      }
      await runAnalysis(file, pdf, false)
    } catch (error) {
      fail(error)
    }
  }

  async function runAnalysis(file: File, pdf: PdfContent, withScans: boolean) {
    dispatch({ type: 'analysisStarted' })

    const pagesToSend = withScans ? pdf.scanPages.slice(0, MAX_SCANS) : []
    const skippedPages = pdf.scanPages.filter(
      (page) => !pagesToSend.includes(page),
    )
    if (skippedPages.length === pdf.pages) {
      throw new Error(
        'Dokument składa się tylko ze skanów. Bez ich wysłania nie ma czego analizować.',
      )
    }

    let scans: ScanImage[] | undefined
    if (pagesToSend.length > 0) {
      const { renderScans } = await import('../lib/pdf/renderScans')
      scans = await renderScans(file, pagesToSend)
    }
    const result = await analyze({
      fileName: file.name,
      pages: pdf.pages,
      // Tekst stron-skanów (np. sam znak wodny) pomijamy; ich treść niosą obrazy
      text: buildDocumentText(pdf.pageTexts, pdf.scanPages),
      skippedPages,
      scans,
    })
    dispatch({ type: 'succeeded', result })
    onSuccess(result)
  }

  function decideScans(withScans: boolean) {
    if (state.status !== 'askingConsent') return
    runAnalysis(state.file, state.pdf, withScans).catch(fail)
  }

  function retry() {
    if (state.status === 'error' && state.file) {
      void analyzeFile(state.file)
    }
  }

  return {
    state,
    analyzeFile,
    retry,
    sendScans: () => decideScans(true),
    skipScans: () => decideScans(false),
    reset: () => dispatch({ type: 'reset' }),
  }
}
