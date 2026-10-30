import type { ModelOutput } from '../../web/src/lib/schema'

// Wynik scalony z fragmentów; summary i keyPoints daje osobne, końcowe wywołanie modelu
export type MergedOutput = Omit<ModelOutput, 'summary' | 'keyPoints'>

// "ACME  Sp. z o.o." i "acme sp. z o.o." to ta sama nazwa
function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

// Zostawia pierwsze wystąpienie każdego klucza (kolejność fragmentów = kolejność w dokumencie)
function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const itemKey = key(item)
    if (seen.has(itemKey)) return false
    seen.add(itemKey)
    return true
  })
}

// Najczęstsza wartość; przy remisie wygrywa ta z wcześniejszego fragmentu
function mostCommon<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let best: T | undefined
  for (const value of values) {
    if (
      best === undefined ||
      (counts.get(value) ?? 0) > (counts.get(best) ?? 0)
    ) {
      best = value
    }
  }
  return best
}

export function mergeChunkResults(results: ModelOutput[]): MergedOutput {
  const documents = results.map((result) => result.document)
  const types = documents.map((document) => document.type)

  return {
    document: {
      language:
        mostCommon(documents.map((document) => document.language)) ??
        documents[0].language,
      // "inne" tylko wtedy, gdy żaden fragment nie rozpoznał konkretnego typu
      type: mostCommon(types.filter((type) => type !== 'inne')) ?? 'inne',
      title: documents.find((document) => document.title)?.title ?? null,
      date: documents.find((document) => document.date)?.date ?? null,
    },
    entities: {
      organizations: uniqueBy(
        results.flatMap((result) => result.entities.organizations),
        normalize,
      ),
      people: uniqueBy(
        results.flatMap((result) => result.entities.people),
        normalize,
      ),
    },
    amounts: uniqueBy(
      results.flatMap((result) => result.amounts),
      (amount) => `${amount.value}|${amount.currency}`,
    ),
    dates: uniqueBy(
      results.flatMap((result) => result.dates),
      (date) => date.date,
    ),
    keywords: uniqueBy(
      results.flatMap((result) => result.keywords),
      normalize,
    ),
  }
}
