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

  it('porównuje wartość bezwzględną (np. rabat zapisany jako ujemny)', () => {
    expect(filterUngroundedAmounts([amount(-12500)], text, false)).toHaveLength(
      1,
    )
  })
})
