import { describe, expect, it } from 'vitest'
import { buildDocumentText, isLikelyScan } from './pages'

describe('isLikelyScan', () => {
  it('pusta strona to skan', () => {
    expect(isLikelyScan('')).toBe(true)
  })

  it('strona z samym znakiem wodnym POUFNE to skan', () => {
    expect(isLikelyScan('POUFNE\n  3')).toBe(true)
  })

  it('strona z normalnym tekstem nie jest skanem', () => {
    const text = 'Umowa o dzieło zawarta w dniu 14 marca 2026 r. w Krakowie'
    expect(isLikelyScan(text)).toBe(false)
  })
})

describe('buildDocumentText', () => {
  const pages = [
    { page: 1, text: 'Pierwsza strona' },
    { page: 2, text: '' },
    { page: 3, text: 'Trzecia strona' },
  ]

  it('oznacza każdą stronę numerem', () => {
    expect(buildDocumentText(pages, [])).toBe(
      '[Strona 1]\nPierwsza strona\n\n[Strona 2]\n\n\n[Strona 3]\nTrzecia strona',
    )
  })

  it('pomija wskazane strony', () => {
    expect(buildDocumentText(pages, [2])).toBe(
      '[Strona 1]\nPierwsza strona\n\n[Strona 3]\nTrzecia strona',
    )
  })
})
