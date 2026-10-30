import { describe, expect, it } from 'vitest'
import {
  currencyLabel,
  documentTypeLabel,
  formatAmount,
  formatDate,
  formatFileSize,
  formatSkippedPages,
  languageName,
} from './format'

// Intl używa spacji niełamliwej; w testach porównujemy ze zwykłą spacją
const plainSpaces = (text: string) => text.replace(/\s/g, ' ')

describe('formatowanie', () => {
  it('datę ISO zapisuje jako DD.MM.RRRR', () => {
    expect(formatDate('2026-03-14')).toBe('14.03.2026')
  })

  it('kwotę zapisuje z groszami i spacją tysięcy', () => {
    expect(plainSpaces(formatAmount(12500))).toBe('12 500,00')
    expect(plainSpaces(formatAmount(1234567.891))).toBe('1 234 567,89')
    expect(formatAmount(0.5)).toBe('0,50')
  })

  it('PLN pokazuje jako „zł”, inne waluty kodem', () => {
    expect(currencyLabel('PLN')).toBe('zł')
    expect(currencyLabel('EUR')).toBe('EUR')
  })

  it('kod języka zamienia na polską nazwę', () => {
    expect(languageName('pl')).toBe('polski')
    expect(languageName('en')).toBe('angielski')
  })

  it('typ dokumentu ma polską etykietę', () => {
    expect(documentTypeLabel('umowa')).toBe('Umowa')
    expect(documentTypeLabel('inne')).toBe('Inny dokument')
  })

  it('pominięte strony zapisuje skrótem', () => {
    expect(formatSkippedPages([11])).toBe('str. 11')
    expect(formatSkippedPages([3, 11])).toBe('str. 3, 11')
    expect(formatSkippedPages([])).toBe('brak')
  })

  it('rozmiar pliku podaje w KB albo MB', () => {
    expect(formatFileSize(51200)).toBe('50 KB')
    expect(formatFileSize(1572864)).toBe('1,5 MB')
  })
})
