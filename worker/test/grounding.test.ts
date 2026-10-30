import { describe, expect, it } from 'vitest'
import { extractNumbers, filterUngroundedAmounts } from '../src/grounding'

describe('extractNumbers', () => {
  it.each([
    ['12 500,00 zł', 12500],
    ['12\u00a0500,00 zł', 12500], // spacja niełamliwa
    ['12.500,00 PLN', 12500],
    ['12,500.00 EUR', 12500],
    ['12500 zł', 12500],
    ['12.500 zł', 12500],
    ['1 234 567,89', 1234567.89],
    ['kara 0,5%', 0.5],
  ])('odczytuje "%s" jako %d', (text, expected) => {
    expect(extractNumbers(text)).toContain(expected)
  })
})

describe('filterUngroundedAmounts', () => {
  const text = '[Strona 1]\nWynagrodzenie: 12 500,00 zł brutto.'

  const amount = (value: number, source: 'text' | 'ocr' = 'text') => ({
    value,
    currency: 'PLN',
    context: 'Wynagrodzenie',
    source,
  })

  it('zostawia kwotę, która jest w tekście', () => {
    expect(filterUngroundedAmounts([amount(12500)], text, false)).toHaveLength(
      1,
    )
  })

  it('usuwa kwotę, której nie ma w tekście', () => {
    expect(filterUngroundedAmounts([amount(99000)], text, false)).toEqual([])
  })

  it('zostawia kwotę ze skanu, gdy skany były wysłane', () => {
    const result = filterUngroundedAmounts([amount(99000, 'ocr')], text, true)
    expect(result).toHaveLength(1)
  })

  it('sprawdza kwotę "ocr", gdy żadnych skanów nie było', () => {
    expect(
      filterUngroundedAmounts([amount(99000, 'ocr')], text, false),
    ).toEqual([])
  })

  it('kwota z tekstu oznaczona przez model jako "ocr" dostaje source "text"', () => {
    expect(
      filterUngroundedAmounts([amount(12500, 'ocr')], text, false),
    ).toEqual([amount(12500, 'text')])
    expect(filterUngroundedAmounts([amount(12500, 'ocr')], text, true)).toEqual(
      [amount(12500, 'text')],
    )
  })

  it('usuwa kwotę spoza tekstu oznaczoną "text", nawet gdy były skany', () => {
    expect(filterUngroundedAmounts([amount(99000)], text, true)).toEqual([])
  })

  it('porównuje wartość bezwzględną (np. rabat zapisany jako ujemny)', () => {
    expect(filterUngroundedAmounts([amount(-12500)], text, false)).toHaveLength(
      1,
    )
  })
})

describe('filterUngroundedAmounts: kwoty w tysiącach, milionach, miliardach', () => {
  const amount = (value: number) => ({
    value,
    currency: 'PLN',
    context: 'Nakłady',
    source: 'ocr' as const,
  })

  it('uznaje pełną wartość, gdy dokument podaje kwoty w mln (nagłówek tabeli)', () => {
    const text = 'Projekt | Nakłady 2025 (mln zł)\nFarma Dębica II | 212,4'
    expect(filterUngroundedAmounts([amount(212_400_000)], text, true)).toEqual([
      { ...amount(212_400_000), source: 'text' },
    ])
  })

  it('uznaje zapis „4,82 mld zł”', () => {
    const text = 'Przychody wzrosły do 4,82 mld zł.'
    expect(
      filterUngroundedAmounts([amount(4_820_000_000)], text, false),
    ).toHaveLength(1)
  })

  it('nie skaluje, gdy dokument nie używa słowa skali', () => {
    const text = 'Wynagrodzenie: 212,4 zł'
    expect(filterUngroundedAmounts([amount(212_400_000)], text, false)).toEqual(
      [],
    )
  })

  it('usuwa zmyśloną kwotę mimo słowa „mln” w dokumencie', () => {
    const text = 'Nakłady (mln zł): 212,4'
    expect(filterUngroundedAmounts([amount(99_000_000)], text, false)).toEqual(
      [],
    )
  })
})
