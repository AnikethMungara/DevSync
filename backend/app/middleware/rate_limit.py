"""
Rate limiting middleware for WebSocket and HTTP requests
"""

import time
from typing import Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import asyncio
import logging

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Rate limit configuration"""
    max_requests: int  # Maximum number of requests
    window_seconds: int  # Time window in seconds
    block_duration_seconds: int = 60  # How long to block after limit exceeded


@dataclass
class RateLimitEntry:
    """Track rate limit for a specific client"""
    requests: int = 0
    window_start: float = field(default_factory=time.time)
    blocked_until: Optional[float] = None


class RateLimiter:
    """
    In-memory rate limiter with Redis fallback support
    Limits requests per client based on configurable rules
    """

    def __init__(self, redis_manager=None):
        self.redis_manager = redis_manager
        self.clients: Dict[str, RateLimitEntry] = {}
        self._lock = asyncio.Lock()

        # Default rate limit configs
        self.configs = {
            "websocket_connect": RateLimitConfig(
                max_requests=10,
                window_seconds=60,
                block_duration_seconds=300  # 5 minutes
            ),
            "websocket_message": RateLimitConfig(
                max_requests=100,
                window_seconds=10,
                block_duration_seconds=60
            ),
            "http": RateLimitConfig(
                max_requests=100,
                window_seconds=60,
                block_duration_seconds=60
            ),
            "auth": RateLimitConfig(
                max_requests=5,
                window_seconds=300,  # 5 minutes
                block_duration_seconds=900  # 15 minutes
            ),
        }

    async def check_rate_limit(
        self,
        client_id: str,
        limit_type: str = "http"
    ) -> tuple[bool, Optional[str]]:
        """
        Check if client has exceeded rate limit

        Args:
            client_id: Unique client identifier (IP, user ID, etc.)
            limit_type: Type of rate limit to apply

        Returns:
            Tuple of (is_allowed, error_message)
        """
        config = self.configs.get(limit_type, self.configs["http"])

        # Try Redis first if available
        if self.redis_manager and self.redis_manager.connected:
            return await self._check_rate_limit_redis(client_id, config, limit_type)

        # Fall back to in-memory
        return await self._check_rate_limit_memory(client_id, config)

    async def _check_rate_limit_memory(
        self,
        client_id: str,
        config: RateLimitConfig
    ) -> tuple[bool, Optional[str]]:
        """Check rate limit using in-memory storage"""
        async with self._lock:
            current_time = time.time()

            # Get or create entry for client
            if client_id not in self.clients:
                self.clients[client_id] = RateLimitEntry()

            entry = self.clients[client_id]

            # Check if client is blocked
            if entry.blocked_until and current_time < entry.blocked_until:
                remaining = int(entry.blocked_until - current_time)
                return False, f"Rate limit exceeded. Try again in {remaining} seconds"

            # Reset window if expired
            if current_time - entry.window_start > config.window_seconds:
                entry.requests = 0
                entry.window_start = current_time
                entry.blocked_until = None

            # Increment request count
            entry.requests += 1

            # Check if limit exceeded
            if entry.requests > config.max_requests:
                entry.blocked_until = current_time + config.block_duration_seconds
                return False, f"Rate limit exceeded. Blocked for {config.block_duration_seconds} seconds"

            return True, None

    async def _check_rate_limit_redis(
        self,
        client_id: str,
        config: RateLimitConfig,
        limit_type: str
    ) -> tuple[bool, Optional[str]]:
        """Check rate limit using Redis"""
        try:
            key = f"ratelimit:{limit_type}:{client_id}"
            block_key = f"ratelimit:block:{limit_type}:{client_id}"

            # Check if blocked
            blocked = await self.redis_manager.get_cache(block_key)
            if blocked:
                ttl = await self.redis_manager.client.ttl(f"cache:{block_key}")
                return False, f"Rate limit exceeded. Try again in {ttl} seconds"

            # Increment counter
            count = await self.redis_manager.increment(key)

            # Set expiry on first request
            if count == 1:
                await self.redis_manager.client.expire(
                    f"counter:{key}",
                    config.window_seconds
                )

            # Check if limit exceeded
            if count > config.max_requests:
                # Block client
                await self.redis_manager.set_cache(
                    block_key,
                    "1",
                    expire=config.block_duration_seconds
                )
                return False, f"Rate limit exceeded. Blocked for {config.block_duration_seconds} seconds"

            return True, None

        except Exception as e:
            logger.error(f"Redis rate limit error: {e}")
            # Fall back to in-memory
            return await self._check_rate_limit_memory(client_id, config)

    async def reset_client(self, client_id: str, limit_type: str = "http"):
        """Reset rate limit for a client"""
        async with self._lock:
            if client_id in self.clients:
                del self.clients[client_id]

        if self.redis_manager and self.redis_manager.connected:
            key = f"ratelimit:{limit_type}:{client_id}"
            block_key = f"ratelimit:block:{limit_type}:{client_id}"
            await self.redis_manager.reset_counter(key)
            await self.redis_manager.delete_cache(block_key)

    async def cleanup_old_entries(self):
        """Clean up old in-memory entries"""
        async with self._lock:
            current_time = time.time()
            to_remove = []

            for client_id, entry in self.clients.items():
                # Remove entries older than 1 hour
                if current_time - entry.window_start > 3600:
                    to_remove.append(client_id)

            for client_id in to_remove:
                del self.clients[client_id]

            if to_remove:
                logger.info(f"Cleaned up {len(to_remove)} old rate limit entries")

    def get_config(self, limit_type: str) -> RateLimitConfig:
        """Get rate limit configuration for a specific type"""
        return self.configs.get(limit_type, self.configs["http"])

    def set_config(self, limit_type: str, config: RateLimitConfig):
        """Set rate limit configuration for a specific type"""
        self.configs[limit_type] = config


# Global rate limiter instance
rate_limiter = RateLimiter()
