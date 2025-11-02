"""Database service using aiosqlite"""
import aiosqlite
from pathlib import Path
from typing import Optional, List, Dict, Any
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class Database:
    """SQLite database manager"""

    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.conn: Optional[aiosqlite.Connection] = None

    async def initialize(self):
        """Initialize database and create tables"""
        self.conn = await aiosqlite.connect(str(self.db_path))
        self.conn.row_factory = aiosqlite.Row

        # Create files table
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT UNIQUE NOT NULL,
                content TEXT,
                size INTEGER,
                language TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes
        await self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_files_path ON files(path)
        """)

        await self.conn.commit()
        logger.info(f"Database initialized: {self.db_path}")

    async def close(self):
        """Close database connection"""
        if self.conn:
            await self.conn.close()
            logger.info("Database connection closed")

    async def upsert_file(self, path: str, content: str, size: int, language: Optional[str] = None):
        """Insert or update file record"""
        await self.conn.execute("""
            INSERT INTO files (path, content, size, language, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(path) DO UPDATE SET
                content = excluded.content,
                size = excluded.size,
                language = excluded.language,
                updated_at = CURRENT_TIMESTAMP
        """, (path, content, size, language))
        await self.conn.commit()

    async def delete_file(self, path: str):
        """Delete file record"""
        await self.conn.execute("DELETE FROM files WHERE path = ?", (path,))
        await self.conn.commit()

    async def update_file_path(self, new_path: str, old_path: str):
        """Update file path (for renames)"""
        await self.conn.execute("""
            UPDATE files SET path = ?, updated_at = CURRENT_TIMESTAMP
            WHERE path = ?
        """, (new_path, old_path))
        await self.conn.commit()

    async def get_file(self, path: str) -> Optional[Dict[str, Any]]:
        """Get file record by path"""
        async with self.conn.execute("SELECT * FROM files WHERE path = ?", (path,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
        return None

    async def get_all_files(self) -> List[Dict[str, Any]]:
        """Get all file records"""
        async with self.conn.execute("SELECT * FROM files ORDER BY path") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
