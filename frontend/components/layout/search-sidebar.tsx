"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Filter,
} from "lucide-react"
import { searchFiles, replaceInFiles, type SearchResult, type SearchMatch } from "@/lib/api/search"
import { useToast } from "@/hooks/use-toast"

interface SearchSidebarProps {
  onNavigate?: (path: string, line: number) => void
}

export function SearchSidebar({ onNavigate }: SearchSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [filePattern, setFilePattern] = useState("")
  const [showReplace, setShowReplace] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [totalMatches, setTotalMatches] = useState(0)
  const [filesSearched, setFilesSearched] = useState(0)
  const { toast } = useToast()

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotalMatches(0)
      setFilesSearched(0)
      return
    }

    setLoading(true)
    try {
      const data = await searchFiles({
        query: searchQuery,
        caseSensitive,
        wholeWord,
        regex: useRegex,
        filePattern: filePattern || undefined,
      })

      setResults(data.results || [])
      setTotalMatches(data.totalMatches)
      setFilesSearched(data.filesSearched)

      // Expand all files by default when search results arrive
      setExpandedFiles(new Set(data.results?.map((r) => r.path) || []))

      // Show success toast
      if (data.results.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${data.totalMatches} matches in ${data.results.length} files`,
        })
      }
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const performReplace = async (filePath?: string) => {
    if (!searchQuery.trim() || !replaceQuery) return

    setLoading(true)
    try {
      const result = await replaceInFiles({
        searchQuery,
        replaceQuery,
        caseSensitive,
        wholeWord,
        regex: useRegex,
        filePath,
      })

      // Show success toast
      toast({
        title: "Replace Complete",
        description: `Replaced ${result.totalReplacements} matches in ${result.filesModified} files`,
      })

      // Refresh search results after replace
      await performSearch()
    } catch (error) {
      console.error("Replace failed:", error)
      toast({
        title: "Replace Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToMatch = (path: string, line: number) => {
    if (onNavigate) {
      onNavigate(path, line)
    } else {
      console.log(`Navigate to ${path}:${line}`)
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

          {/* File Pattern Filter */}
          {showFilters && (
            <Input
              placeholder="Files to include (e.g., *.ts, *.tsx)"
              value={filePattern}
              onChange={(e) => setFilePattern(e.target.value)}
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
              variant={showFilters ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={showReplace ? "secondary" : "ghost"}
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
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-4">
              <span>
                {totalMatches} {totalMatches === 1 ? "match" : "matches"} in {results.length}{" "}
                {results.length === 1 ? "file" : "files"}
              </span>
              <span>({filesSearched} files searched)</span>
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
                        className="rounded-md px-2 py-1 text-xs hover:bg-accent cursor-pointer font-mono group"
                        onClick={() => handleNavigateToMatch(result.path, match.line)}
                        title={`Click to go to ${result.path}:${match.line}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground shrink-0 w-8 group-hover:text-primary">
                            {match.line}
                          </span>
                          <span className="break-all">
                            {match.text.substring(0, match.matchStart)}
                            <span className="bg-yellow-500/30 text-yellow-900 dark:text-yellow-100 font-semibold">
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
