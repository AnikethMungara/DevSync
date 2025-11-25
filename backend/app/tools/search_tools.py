"""Search tools (stub for web search integration)"""
from typing import Dict, Any
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


async def search_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Search the web (stub - requires search service integration).

    Args:
        query: Search query
        max_results: Maximum number of results

    Returns:
        Dict with search results or error
    """
    # This is a stub. In a real implementation, you would:
    # 1. Integrate with a search API (Google Custom Search, Bing, etc.)
    # 2. Or use a search service like Tavily, Serper, etc.
    # 3. Or integrate with your existing search functionality

    logger.info(f"Search requested: {query}")

    return {
        "error": "Web search is not configured. Please integrate a search service.",
        "query": query,
        "results": []
    }
