import { describe, expect, it } from 'vitest'
import { piecesToLines, type TextPiece } from './lines'

// Element o wysokości 10, szerokość: 5 na znak
function piece(str: string, x: number, y: number, hasEOL = false): TextPiece {
  return { str, x, y, width: str.length * 5, height: 10, hasEOL }
}

describe('piecesToLines', () => {
  it('łączy elementy stykające się w poziomie bez dodawania spacji', () => {
    const lines = piecesToLines([piece('Umo', 0, 100), piece('wa', 15, 100)])
    expect(lines).toEqual(['Umowa'])
  })

  it('wstawia spację, gdy między elementami jest odstęp', () => {
    const lines = piecesToLines([piece('Umowa', 0, 100), piece('nr', 30, 100)])
    expect(lines).toEqual(['Umowa nr'])
  })

  it('nie dubluje spacji, które są już w tekście', () => {
    const lines = piecesToLines([
      piece('Umowa ', 0, 100),
      piece(' nr', 35, 100),
    ])
    expect(lines).toEqual(['Umowa nr'])
  })

  it('zaczyna nową linię po hasEOL', () => {
    const lines = piecesToLines([
      piece('Pierwsza', 0, 100, true),
      piece('Druga', 0, 100),
    ])
    expect(lines).toEqual(['Pierwsza', 'Druga'])
  })

  it('zaczyna nową linię, gdy zmienia się wysokość y', () => {
    const lines = piecesToLines([piece('Góra', 0, 100), piece('Dół', 0, 85)])
    expect(lines).toEqual(['Góra', 'Dół'])
  })

  it('oddziela kolumny i komórki tabeli znakiem |', () => {
    const lines = piecesToLines([
      piece('Zamawiający', 0, 100),
      piece('Wykonawca', 300, 100),
    ])
    expect(lines).toEqual(['Zamawiający | Wykonawca'])
  })

  it('rozpoznaje kolumny, gdy pdf.js wypełnia przerwę elementem-spacją', () => {
    const lines = piecesToLines([
      piece('Zamawiający', 0, 100),
      { str: ' ', x: 55, y: 100, width: 245, height: 0, hasEOL: false },
      piece('Wykonawca', 300, 100),
    ])
    expect(lines).toEqual(['Zamawiający | Wykonawca'])
  })

  it('element-spacja między słowami daje zwykłą spację', () => {
    const lines = piecesToLines([
      piece('Umowa', 0, 100),
      { str: ' ', x: 25, y: 100, width: 3, height: 0, hasEOL: false },
      piece('nr', 28, 100),
    ])
    expect(lines).toEqual(['Umowa nr'])
  })

  it('pomija puste linie', () => {
    const lines = piecesToLines([
      piece('Tekst', 0, 100, true),
      piece('', 0, 90, true),
      piece('Dalej', 0, 80),
    ])
    expect(lines).toEqual(['Tekst', 'Dalej'])
  })

  it('zwraca pustą listę dla strony bez tekstu', () => {
    expect(piecesToLines([])).toEqual([])
  })
})
