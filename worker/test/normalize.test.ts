import { describe, expect, it } from 'vitest'
import { normalizeCurrency, normalizeModelOutput } from '../src/normalize'

describe('normalizeCurrency', () => {
  it.each([
    ['PLN', 'PLN'],
    ['pln', 'PLN'],
    ['zł', 'PLN'],
    ['ZŁ/m²', 'PLN'],
    ['€', 'EUR'],
    ['EUR/m²', 'EUR'],
    ['EUR za m²', 'EUR'],
    ['$', 'USD'],
  ])('"%s" → "%s"', (raw, expected) => {
    expect(normalizeCurrency(raw)).toBe(expected)
  })

  it('zostawia bez zmian to, czego nie da się rozpoznać', () => {
    expect(normalizeCurrency('netto')).toBe('netto')
    expect(normalizeCurrency('XYZ')).toBe('XYZ')
  })
})

describe('normalizeModelOutput', () => {
  it('poprawia walutę w kwotach, resztę zostawia', () => {
    const output = {
      summary: 'x',
      amounts: [
        { value: 4.15, currency: 'EUR/m²', context: 'Czynsz', source: 'text' },
      ],
    }
    expect(normalizeModelOutput(output)).toEqual({
      summary: 'x',
      amounts: [
        { value: 4.15, currency: 'EUR', context: 'Czynsz', source: 'text' },
      ],
    })
  })

  it('usuwa „kwoty”, które nie są pieniędzmi (powierzchnia, moc)', () => {
    const output = {
      amounts: [
        { value: 12450, currency: 'm²', context: 'Hala', source: 'text' },
        { value: 1200, currency: 'kW', context: 'Moc', source: 'text' },
        { value: 8000, currency: 'EUR', context: 'Czynsz', source: 'text' },
      ],
    }
    expect(normalizeModelOutput(output)).toEqual({
      amounts: [
        { value: 8000, currency: 'EUR', context: 'Czynsz', source: 'text' },
      ],
    })
  })

  it('nie zmienia odpowiedzi, która nie jest obiektem z kwotami', () => {
    expect(normalizeModelOutput(null)).toBeNull()
    expect(normalizeModelOutput({ summary: 'x' })).toEqual({ summary: 'x' })
  })
})
