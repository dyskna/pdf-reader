import { useReducer } from 'react'
import { analyze } from '../api/analyze'
import { analysisReducer, initialState } from '../lib/analysisState'
import { buildDocumentText } from '../lib/pdf/pages'
import { readPdf } from '../lib/pdf/readPdf'
import { validateFile } from '../lib/pdf/validateFile'

// Cała logika ekranu: walidacja › odczyt PDF › analiza. Komponenty tylko wyświetlają stan.
export function usePdfAnalysis() {
  const [state, dispatch] = useReducer(analysisReducer, initialState)

  async function analyzeFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      dispatch({ type: 'failed', message: validationError })
      return
    }

    dispatch({ type: 'started', file })
    try {
      const pdf = await readPdf(file)
      if (pdf.scanPages.length === pdf.pages) {
        throw new Error(
          'Plik nie zawiera tekstu do odczytania (wszystkie strony to skany).',
        )
      }
      dispatch({ type: 'textRead' })

      // Na razie strony-skany pomijamy. Zgoda na OCR dojdzie w etapie 3.
      const skippedPages = pdf.scanPages
      const result = await analyze({
        fileName: file.name,
        pages: pdf.pages,
        text: buildDocumentText(pdf.pageTexts, skippedPages),
        skippedPages,
      })

      // fileName, pages i skippedPages zna przeglądarka, nie model
      dispatch({
        type: 'succeeded',
        result: {
          ...result,
          document: {
            ...result.document,
            fileName: file.name,
            pages: pdf.pages,
          },
          skippedPages,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nieznany błąd.'
      dispatch({ type: 'failed', message })
    }
  }

  function retry() {
    if (state.status === 'error' && state.file) {
      void analyzeFile(state.file)
    }
  }

  return { state, analyzeFile, retry }
}
