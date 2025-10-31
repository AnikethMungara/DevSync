import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'devsync.db');

console.log('Migrating files table...');
console.log('Database:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // Check if files table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='files'
  `).get();

  if (tableExists) {
    console.log('Files table exists, backing up data...');

    // Create backup of existing data
    db.exec(`
      CREATE TABLE IF NOT EXISTS files_backup AS
      SELECT * FROM files
    `);

    // Drop old table
    db.exec('DROP TABLE files');
    console.log('Dropped old files table');
  }

  // Create new files table with updated schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      path TEXT NOT NULL UNIQUE,
      content TEXT,
      size INTEGER DEFAULT 0,
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);
  console.log('Created new files table with UNIQUE(path) constraint');

  // Restore data if backup exists
  const backupExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='files_backup'
  `).get();

  if (backupExists) {
    console.log('Restoring data from backup...');

    // Get all backed up files
    const backedUpFiles = db.prepare('SELECT * FROM files_backup').all();

    if (backedUpFiles.length > 0) {
      const insert = db.prepare(`
        INSERT INTO files (id, project_id, path, content, size, last_modified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const file of backedUpFiles) {
        try {
          insert.run(
            file.id,
            file.project_id,
            file.path,
            file.content,
            file.size,
            file.last_modified,
            file.created_at
          );
        } catch (err) {
          console.warn(`Skipping duplicate file: ${file.path}`);
        }
      }

      console.log(`Restored ${backedUpFiles.length} files`);
    }

    // Drop backup table
    db.exec('DROP TABLE files_backup');
    console.log('Cleaned up backup table');
  }

  // Recreate index
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id)
  `);

  // Commit transaction
  db.exec('COMMIT');

  console.log('Migration completed successfully!');

  // Show current schema
  const schema = db.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type='table' AND name='files'
  `).get();

  console.log('\nNew schema:');
  console.log(schema.sql);

} catch (error) {
  console.error('Migration failed:', error);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
