"""HTTP tools for fetching URLs"""
import aiohttp
from typing import Dict, Any, Optional
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


async def fetch_url(
    url: str,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    max_bytes: int = 200000
) -> Dict[str, Any]:
    """
    Fetch content from a URL.

    Args:
        url: URL to fetch
        method: HTTP method
        headers: HTTP headers
        max_bytes: Maximum bytes to read

    Returns:
        Dict with response content or error
    """
    if settings.DISABLE_NETWORK:
        return {"error": "Network access is disabled"}

    headers = headers or {}

    try:
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            return {"error": "Only HTTP/HTTPS URLs are allowed"}

        timeout = aiohttp.ClientTimeout(total=30)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.request(method, url, headers=headers) as response:
                # Check content length
                content_length = response.headers.get('Content-Length')
                if content_length and int(content_length) > max_bytes:
                    return {
                        "error": f"Response too large: {content_length} bytes (max: {max_bytes})",
                        "truncated": True
                    }

                # Read response
                content = await response.read()

                if len(content) > max_bytes:
                    content = content[:max_bytes]
                    truncated = True
                else:
                    truncated = False

                # Try to decode as text
                try:
                    text_content = content.decode('utf-8', errors='replace')
                except:
                    text_content = content.decode('latin-1', errors='replace')

                return {
                    "url": url,
                    "status": response.status,
                    "headers": dict(response.headers),
                    "content": text_content,
                    "size": len(content),
                    "truncated": truncated,
                    "success": 200 <= response.status < 300
                }

    except aiohttp.ClientError as e:
        logger.error(f"HTTP client error: {e}")
        return {"error": f"HTTP request failed: {str(e)}"}
    except Exception as e:
        logger.error(f"Error fetching URL: {e}", exc_info=True)
        return {"error": f"Failed to fetch URL: {str(e)}"}
