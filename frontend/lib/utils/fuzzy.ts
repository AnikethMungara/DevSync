export function fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  if (queryLower === "") return { matches: true, score: 0 }
  if (textLower.includes(queryLower)) return { matches: true, score: 100 }

  let score = 0
  let queryIndex = 0
  let lastMatchIndex = -1

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += lastMatchIndex === i - 1 ? 5 : 1
      lastMatchIndex = i
      queryIndex++
    }
  }

  const matches = queryIndex === queryLower.length
  return { matches, score }
}

export function sortByFuzzyScore<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  if (!query) return items

  return items
    .map((item) => ({
      item,
      ...fuzzyMatch(getText(item), query),
    }))
    .filter((result) => result.matches)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item)
}
