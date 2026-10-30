import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// pdf.js parsuje PDF w osobnym wątku. Import `?url` sprawia, że Vite kopiuje plik
// workera do builda i zwraca jego adres razem z base /pdf-reader/.
GlobalWorkerOptions.workerSrc = workerUrl

// Dekodery obrazów (wasm) i fonty standardowe są potrzebne do renderowania skanów.
// Skrypt scripts/copy-pdfjs.mjs kopiuje je do public/pdfjs/ przed dev i buildem.
const assetsUrl = new URL(
  `${import.meta.env.BASE_URL}pdfjs/`,
  window.location.origin,
).href

export function openPdf(data: Uint8Array) {
  return getDocument({
    data,
    wasmUrl: `${assetsUrl}wasm/`,
    standardFontDataUrl: `${assetsUrl}standard_fonts/`,
  })
}
