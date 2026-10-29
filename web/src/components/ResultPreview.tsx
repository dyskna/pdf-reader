import type { AnalysisResult } from '../lib/schema'

export function ResultPreview({ result }: { result: AnalysisResult }) {
  return (
    <section>
      <h2>Wynik</h2>
      {result.skippedPages.length > 0 && (
        <p className="warning">
          Strony bez warstwy tekstowej (pominięte):{' '}
          {result.skippedPages.join(', ')}. Wyniki mogą być niepełne.
        </p>
      )}
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </section>
  )
}
