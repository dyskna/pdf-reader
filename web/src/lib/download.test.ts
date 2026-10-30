import { describe, expect, it } from 'vitest'
import { jsonFileName } from './download'

describe('jsonFileName', () => {
  it('zamienia rozszerzenie .pdf na -analiza.json', () => {
    expect(jsonFileName('umowa.pdf')).toBe('umowa-analiza.json')
    expect(jsonFileName('RAPORT.PDF')).toBe('RAPORT-analiza.json')
  })

  it('usuwa znaki niedozwolone w nazwach plików', () => {
    expect(jsonFileName('Umowa 14/2026: wersja?.pdf')).toBe(
      'Umowa 14-2026- wersja-analiza.json',
    )
  })

  it('nie obcina liter z końca nazwy', () => {
    expect(jsonFileName('faktury.pdf')).toBe('faktury-analiza.json')
  })

  it('pusta nazwa daje „dokument”', () => {
    expect(jsonFileName('.pdf')).toBe('dokument-analiza.json')
  })
})
