"""
Search and replace router for DevSync IDE.
Provides endpoints for searching text across files and replacing matches.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import os
import re
from pathlib import Path

router = APIRouter()

# Get workspace root from environment or use default
WORKSPACE_ROOT = os.getenv("WORKSPACE_ROOT", "./workspace")

# Files and directories to ignore
IGNORE_PATTERNS = {
    ".git", ".svn", ".hg",
    "node_modules", "__pycache__", ".pytest_cache",
    "venv", "env", ".env",
    ".vscode", ".idea",
    "*.pyc", "*.pyo", "*.so", "*.dll", "*.exe",
    "*.jpg", "*.jpeg", "*.png", "*.gif", "*.ico",
    "*.pdf", "*.zip", "*.tar", "*.gz",
}


class SearchMatch(BaseModel):
    """A single search match within a file"""
    line: int
    column: int
    text: str
    matchStart: int
    matchEnd: int


class SearchResult(BaseModel):
    """Search results for a single file"""
    path: str
    matches: List[SearchMatch]


class SearchResponse(BaseModel):
    """Response containing all search results"""
    results: List[SearchResult]
    totalMatches: int
    filesSearched: int


class ReplaceRequest(BaseModel):
    """Request to perform search and replace"""
    searchQuery: str
    replaceQuery: str
    caseSensitive: bool = False
    wholeWord: bool = False
    regex: bool = False
    filePath: Optional[str] = None  # If provided, replace only in this file


class ReplaceResponse(BaseModel):
    """Response after performing replace"""
    filesModified: int
    totalReplacements: int


def should_ignore(path: Path) -> bool:
    """Check if a file or directory should be ignored"""
    for part in path.parts:
        if part.startswith('.') and part not in {'.', '..'}:
            return True
        if part in IGNORE_PATTERNS:
            return True

    # Check file extension patterns
    for pattern in IGNORE_PATTERNS:
        if '*' in pattern and path.match(pattern):
            return True

    return False


def is_text_file(filepath: Path) -> bool:
    """Check if a file is likely a text file"""
    try:
        # Try to read first 8192 bytes and check for null bytes
        with open(filepath, 'rb') as f:
            chunk = f.read(8192)
            if b'\x00' in chunk:
                return False
        return True
    except:
        return False


def search_in_file(
    filepath: Path,
    pattern: str,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool
) -> List[SearchMatch]:
    """Search for pattern in a file and return matches"""
    matches = []

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        # Build regex pattern
        if use_regex:
            regex_pattern = pattern
        else:
            # Escape special regex characters
            regex_pattern = re.escape(pattern)

        if whole_word:
            regex_pattern = r'\b' + regex_pattern + r'\b'

        flags = 0 if case_sensitive else re.IGNORECASE
        compiled_pattern = re.compile(regex_pattern, flags)

        for line_num, line_text in enumerate(lines, start=1):
            # Find all matches in this line
            for match in compiled_pattern.finditer(line_text):
                matches.append(SearchMatch(
                    line=line_num,
                    column=match.start() + 1,
                    text=line_text.rstrip('\n'),
                    matchStart=match.start(),
                    matchEnd=match.end()
                ))

    except Exception as e:
        # Skip files that can't be read
        pass

    return matches


@router.get("/", response_model=SearchResponse)
async def search_files(
    query: str = Query(..., description="Search query"),
    caseSensitive: bool = Query(False, description="Case sensitive search"),
    wholeWord: bool = Query(False, description="Match whole words only"),
    regex: bool = Query(False, description="Use regular expressions")
):
    """
    Search for text across all files in the workspace.
    """
    if not query:
        return SearchResponse(results=[], totalMatches=0, filesSearched=0)

    workspace_path = Path(WORKSPACE_ROOT)
    if not workspace_path.exists():
        raise HTTPException(status_code=400, detail="Workspace directory does not exist")

    results = []
    files_searched = 0
    total_matches = 0

    # Walk through workspace directory
    for root, dirs, files in os.walk(workspace_path):
        root_path = Path(root)

        # Filter out ignored directories
        dirs[:] = [d for d in dirs if not should_ignore(root_path / d)]

        for filename in files:
            filepath = root_path / filename

            # Skip ignored files
            if should_ignore(filepath):
                continue

            # Skip non-text files
            if not is_text_file(filepath):
                continue

            files_searched += 1

            # Search in this file
            matches = search_in_file(filepath, query, caseSensitive, wholeWord, regex)

            if matches:
                # Get relative path from workspace root
                try:
                    relative_path = filepath.relative_to(workspace_path)
                    results.append(SearchResult(
                        path=str(relative_path).replace('\\', '/'),
                        matches=matches
                    ))
                    total_matches += len(matches)
                except ValueError:
                    # Skip if path is not relative to workspace
                    pass

    return SearchResponse(
        results=results,
        totalMatches=total_matches,
        filesSearched=files_searched
    )


@router.post("/replace", response_model=ReplaceResponse)
async def replace_in_files(request: ReplaceRequest):
    """
    Search and replace text across files.
    If filePath is provided, only replace in that file.
    Otherwise, replace in all matching files.
    """
    if not request.searchQuery:
        raise HTTPException(status_code=400, detail="Search query is required")

    workspace_path = Path(WORKSPACE_ROOT)
    if not workspace_path.exists():
        raise HTTPException(status_code=400, detail="Workspace directory does not exist")

    # Build regex pattern
    if request.regex:
        regex_pattern = request.searchQuery
    else:
        regex_pattern = re.escape(request.searchQuery)

    if request.wholeWord:
        regex_pattern = r'\b' + regex_pattern + r'\b'

    flags = 0 if request.caseSensitive else re.IGNORECASE
    compiled_pattern = re.compile(regex_pattern, flags)

    files_modified = 0
    total_replacements = 0

    # Determine which files to process
    if request.filePath:
        # Replace only in specified file
        files_to_process = [workspace_path / request.filePath]
    else:
        # Find all files with matches
        files_to_process = []
        for root, dirs, files in os.walk(workspace_path):
            root_path = Path(root)
            dirs[:] = [d for d in dirs if not should_ignore(root_path / d)]

            for filename in files:
                filepath = root_path / filename
                if should_ignore(filepath) or not is_text_file(filepath):
                    continue
                files_to_process.append(filepath)

    # Perform replacement
    for filepath in files_to_process:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            # Perform replacement
            new_content, num_replacements = compiled_pattern.subn(
                request.replaceQuery,
                original_content
            )

            # Only write if there were changes
            if num_replacements > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                files_modified += 1
                total_replacements += num_replacements

        except Exception as e:
            # Skip files that can't be processed
            continue

    return ReplaceResponse(
        filesModified=files_modified,
        totalReplacements=total_replacements
    )
