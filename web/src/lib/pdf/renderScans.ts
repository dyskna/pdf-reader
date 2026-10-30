import { openPdf } from './pdfjs'

// Około 150 DPI (PDF liczy w punktach, 72 na cal), ale najwyżej 2000 px na dłuższym boku
const TARGET_SCALE = 150 / 72
const MAX_SIDE_PX = 2000
const JPEG_QUALITY = 0.7

export type ScanImage = {
  page: number
  data: string // JPEG w base64, bez prefiksu "data:image/jpeg;base64,"
}

// Renderuje w przeglądarce tylko wskazane strony do JPEG. Wywoływane wyłącznie za zgodą użytkownika.
export async function renderScans(
  file: File,
  pageNumbers: number[],
): Promise<ScanImage[]> {
  const loadingTask = openPdf(new Uint8Array(await file.arrayBuffer()))
  try {
    const pdf = await loadingTask.promise
    const images: ScanImage[] = []

    for (const pageNumber of pageNumbers) {
      const page = await pdf.getPage(pageNumber)
      const size = page.getViewport({ scale: 1 })
      const scale = Math.min(
        TARGET_SCALE,
        MAX_SIDE_PX / Math.max(size.width, size.height),
      )
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvas, viewport }).promise

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      images.push({ page: pageNumber, data: dataUrl.split(',')[1] })
    }
    return images
  } catch (error) {
    throw new Error('Nie udało się przygotować obrazów skanów.', {
      cause: error,
    })
  } finally {
    await loadingTask.destroy()
  }
}
