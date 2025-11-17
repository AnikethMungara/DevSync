/**
 * Custom hook for file search functionality
 * Provides search state management and operations
 */

import { useState, useCallback } from "react"
import {
  searchFiles,
  replaceInFiles,
  type SearchResult,
  type SearchOptions,
  type ReplaceOptions,
} from "@/lib/api/search"

export interface UseSearchOptions {
  onSearchComplete?: (results: SearchResult[]) => void
  onReplaceComplete?: (filesModified: number, totalReplacements: number) => void
  onError?: (error: Error) => void
}

export function useSearch(options: UseSearchOptions = {}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [totalMatches, setTotalMatches] = useState(0)
  const [filesSearched, setFilesSearched] = useState(0)

  const search = useCallback(
    async (searchOptions: Omit<SearchOptions, "query"> & { query?: string } = {}) => {
      const query = searchOptions.query ?? searchQuery

      if (!query.trim()) {
        setResults([])
        setTotalMatches(0)
        setFilesSearched(0)
        return
      }

      setLoading(true)
      try {
        const data = await searchFiles({
          ...searchOptions,
          query,
        })

        setResults(data.results)
        setTotalMatches(data.totalMatches)
        setFilesSearched(data.filesSearched)

        options.onSearchComplete?.(data.results)

        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Search failed")
        options.onError?.(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [searchQuery, options]
  )

  const replace = useCallback(
    async (replaceOptions: Omit<ReplaceOptions, "searchQuery"> & { searchQuery?: string }) => {
      const query = replaceOptions.searchQuery ?? searchQuery

      if (!query.trim() || !replaceOptions.replaceQuery) {
        throw new Error("Both search and replace queries are required")
      }

      setLoading(true)
      try {
        const result = await replaceInFiles({
          ...replaceOptions,
          searchQuery: query,
        })

        options.onReplaceComplete?.(result.filesModified, result.totalReplacements)

        // Refresh search results after replace
        await search()

        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Replace failed")
        options.onError?.(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [searchQuery, search, options]
  )

  const clear = useCallback(() => {
    setSearchQuery("")
    setResults([])
    setTotalMatches(0)
    setFilesSearched(0)
  }, [])

  return {
    // State
    searchQuery,
    results,
    loading,
    totalMatches,
    filesSearched,

    // Actions
    setSearchQuery,
    search,
    replace,
    clear,
  }
}
