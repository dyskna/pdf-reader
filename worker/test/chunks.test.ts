import { describe, expect, it } from 'vitest'
import { splitIntoChunks } from '../src/chunks'

// Strona w formacie z przeglądarki: "[Strona N]\n" + tekst o zadanej długości
function page(number: number, length: number): string {
  const header = `[Strona ${number}]\n`
  return header + 'a'.repeat(length - header.length)
}

function documentText(...pages: string[]): string {
  return pages.join('\n\n')
}

describe('splitIntoChunks', () => {
  it('krótki tekst zostaje jednym fragmentem', () => {
    const text = documentText(page(1, 100), page(2, 100))
    const chunks = splitIntoChunks(text, [], 1000)
    expect(chunks).toEqual([{ firstPage: 1, text, scans: [] }])
  })

  it('tnie tylko po granicach stron', () => {
    const text = documentText(page(1, 400), page(2, 400), page(3, 400))
    const chunks = splitIntoChunks(text, [], 1000)

    expect(chunks.map((chunk) => chunk.firstPage)).toEqual([1, 3])
    expect(chunks[0].text).toBe(documentText(page(1, 400), page(2, 400)))
    expect(chunks[1].text).toBe(page(3, 400))
  })

  it('stronę dłuższą niż limit daje do osobnego fragmentu w całości', () => {
    const text = documentText(page(1, 100), page(2, 5000), page(3, 100))
    const chunks = splitIntoChunks(text, [], 1000)

    expect(chunks.map((chunk) => chunk.firstPage)).toEqual([1, 2, 3])
    expect(chunks[1].text).toHaveLength(5000)
  })

  it('przypisuje skan do fragmentu z jego stroną', () => {
    // Strony 1–2 w pierwszym fragmencie, 4–5 w drugim; strona 3 to skan bez tekstu
    const text = documentText(
      page(1, 400),
      page(2, 400),
      page(4, 400),
      page(5, 400),
    )
    const scan = { page: 3, data: 'AAAA' }
    const late = { page: 5, data: 'BBBB' }
    const chunks = splitIntoChunks(text, [scan, late], 1000)

    expect(chunks[0].scans).toEqual([scan])
    expect(chunks[1].scans).toEqual([late])
  })

  it('dokument z samych skanów to jeden fragment z pustym tekstem', () => {
    const scans = [
      { page: 1, data: 'AAAA' },
      { page: 2, data: 'BBBB' },
    ]
    expect(splitIntoChunks('', scans, 1000)).toEqual([
      { firstPage: 1, text: '', scans },
    ])
  })
})
