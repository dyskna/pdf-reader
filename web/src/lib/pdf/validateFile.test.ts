import { describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE, validateFile } from './validateFile'

describe('validateFile', () => {
  it('przyjmuje PDF', () => {
    const file = { name: 'umowa.pdf', type: 'application/pdf', size: 1000 }
    expect(validateFile(file)).toBeNull()
  })

  it('przyjmuje PDF bez typu MIME, po rozszerzeniu', () => {
    expect(validateFile({ name: 'UMOWA.PDF', type: '', size: 1000 })).toBeNull()
  })

  it('przyjmuje plik dokładnie 10 MB', () => {
    const file = { name: 'a.pdf', type: 'application/pdf', size: MAX_FILE_SIZE }
    expect(validateFile(file)).toBeNull()
  })

  it('odrzuca plik, który nie jest PDF', () => {
    const file = { name: 'zdjecie.png', type: 'image/png', size: 1000 }
    expect(validateFile(file)).toContain('nie jest plik PDF')
  })

  it('odrzuca pusty plik', () => {
    const file = { name: 'a.pdf', type: 'application/pdf', size: 0 }
    expect(validateFile(file)).toBe('Plik jest pusty.')
  })

  it('odrzuca plik większy niż 10 MB', () => {
    const file = {
      name: 'a.pdf',
      type: 'application/pdf',
      size: MAX_FILE_SIZE + 1,
    }
    expect(validateFile(file)).toContain('10 MB')
  })
})
