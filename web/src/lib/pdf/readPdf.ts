import { getDocument, GlobalWorkerOptions, PasswordException } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { piecesToLines, type TextPiece } from './lines'
import { isLikelyScan, type PageText } from './pages'

// pdf.js parsuje PDF w osobnym wątku. Import `?url` sprawia, że Vite kopiuje plik
// workera do builda i zwraca jego adres razem z base /pdf-reader/.
GlobalWorkerOptions.workerSrc = workerUrl

export type PdfContent = {
  pages: number
  pageTexts: PageText[]
  scanPages: number[] // strony bez warstwy tekstowej
}

export async function readPdf(file: File): Promise<PdfContent> {
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({ data })

  try {
    const pdf = await loadingTask.promise.catch((error: unknown) => {
      throw toReadError(error)
    })
    const pageTexts: PageText[] = []
    const scanPages: number[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pieces: TextPiece[] = content.items
        .filter((item) => 'str' in item)
        .map((item) => ({
          str: item.str,
          // transform to macierz [a, b, c, d, x, y]; x i y to pozycja tekstu
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
          hasEOL: item.hasEOL,
        }))

      const text = piecesToLines(pieces).join('\n')
      pageTexts.push({ page: pageNumber, text })
      if (isLikelyScan(text)) {
        scanPages.push(pageNumber)
      }
    }

    return { pages: pdf.numPages, pageTexts, scanPages }
  } finally {
    // Zwalnia pamięć i wątek pdf.js po odczycie
    await loadingTask.destroy()
  }
}

function toReadError(error: unknown): Error {
  if (error instanceof PasswordException) {
    return new Error(
      'Plik jest chroniony hasłem. Usuń hasło i spróbuj ponownie.',
      { cause: error },
    )
  }
  return new Error('Nie udało się odczytać pliku. Może być uszkodzony.', {
    cause: error,
  })
}
