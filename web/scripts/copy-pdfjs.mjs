// Kopiuje pliki pomocnicze pdf.js (dekodery obrazów wasm i fonty standardowe)
// do public/pdfjs/, skąd Vite dołącza je do builda. Folder jest w .gitignore.
import { cpSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const pdfjsDir = dirname(require.resolve('pdfjs-dist/package.json'))

for (const folder of ['wasm', 'standard_fonts']) {
  cpSync(join(pdfjsDir, folder), join('public', 'pdfjs', folder), {
    recursive: true,
  })
}
