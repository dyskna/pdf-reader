import type { AnalysisResult } from '../lib/schema'

export function ResultPreview({ result }: { result: AnalysisResult }) {
  const skipped = result.skippedPages
  return (
    <section>
      <h2>Wynik</h2>
      {skipped.length > 0 && (
        <p className="warning">
          {skipped.length === 1
            ? `Strona ${skipped[0]} nie została przeanalizowana, wyniki mogą być niepełne.`
            : `Strony ${skipped.join(', ')} nie zostały przeanalizowane, wyniki mogą być niepełne.`}
        </p>
      )}
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </section>
  )
}
