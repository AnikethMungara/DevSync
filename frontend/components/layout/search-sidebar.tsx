"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Replace,
  CaseSensitive,
  WholeWord,
  Regex,
  ChevronRight,
  ChevronDown,
  FileText,
} from "lucide-react"

interface SearchResult {
  path: string
  matches: SearchMatch[]
}

interface SearchMatch {
  line: number
  column: number
  text: string
  matchStart: number
  matchEnd: number
}

export function SearchSidebar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [showReplace, setShowReplace] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        caseSensitive: caseSensitive.toString(),
        wholeWord: wholeWord.toString(),
        regex: useRegex.toString(),
      })

      const response = await fetch(`http://localhost:8787/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        // Expand all files by default when search results arrive
        setExpandedFiles(new Set(data.results?.map((r: SearchResult) => r.path) || []))
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const performReplace = async (filePath?: string) => {
    if (!searchQuery.trim() || !replaceQuery) return

    setLoading(true)
    try {
      const response = await fetch("http://localhost:8787/api/search/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQuery,
          replaceQuery,
          caseSensitive,
          wholeWord,
          regex: useRegex,
          filePath, // If provided, replace only in this file
        }),
      })

      if (response.ok) {
        // Refresh search results after replace
        await performSearch()
      }
    } catch (error) {
      console.error("Replace failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFileExpansion = (path: string) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFiles(newExpanded)
  }

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0)

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4" />
          <h2 className="font-semibold">Search</h2>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                performSearch()
              }
            }}
          />

          {/* Replace Input */}
          {showReplace && (
            <Input
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
            />
          )}

          {/* Search Options */}
          <div className="flex items-center gap-1">
            <Button
              variant={caseSensitive ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setCaseSensitive(!caseSensitive)}
              title="Match Case"
            >
              <CaseSensitive className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={wholeWord ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setWholeWord(!wholeWord)}
              title="Match Whole Word"
            >
              <WholeWord className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={useRegex ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setUseRegex(!useRegex)}
              title="Use Regular Expression"
            >
              <Regex className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowReplace(!showReplace)}
              title="Toggle Replace"
            >
              <Replace className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={performSearch} disabled={loading}>
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
            {showReplace && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => performReplace()}
                disabled={loading || !searchQuery || !replaceQuery}
              >
                <Replace className="h-3 w-3 mr-1" />
                Replace All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {/* Results Summary */}
          {results.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>
                {totalMatches} {totalMatches === 1 ? "result" : "results"} in {results.length}{" "}
                {results.length === 1 ? "file" : "files"}
              </span>
            </div>
          )}

          {/* Results by File */}
          {results.map((result) => {
            const isExpanded = expandedFiles.has(result.path)

            return (
              <div key={result.path} className="space-y-1">
                {/* File Header */}
                <div
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer group"
                  onClick={() => toggleFileExpansion(result.path)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                    <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="text-sm truncate">{result.path}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {result.matches.length}
                  </Badge>
                </div>

                {/* Match Lines */}
                {isExpanded && (
                  <div className="ml-6 space-y-0.5">
                    {result.matches.map((match, idx) => (
                      <div
                        key={idx}
                        className="rounded-md px-2 py-1 text-xs hover:bg-accent cursor-pointer font-mono"
                        onClick={() => {
                          // Navigate to file and line
                          console.log(`Navigate to ${result.path}:${match.line}`)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground shrink-0 w-8">{match.line}</span>
                          <span className="break-all">
                            {match.text.substring(0, match.matchStart)}
                            <span className="bg-yellow-500/30 text-yellow-900 dark:text-yellow-100">
                              {match.text.substring(match.matchStart, match.matchEnd)}
                            </span>
                            {match.text.substring(match.matchEnd)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* No Results */}
          {!loading && searchQuery && results.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No results found for "{searchQuery}"
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Enter a search query to find text across files
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
