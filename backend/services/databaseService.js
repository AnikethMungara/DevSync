import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'devsync.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH, { verbose: logger.debug.bind(logger) });

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initDatabase() {
  logger.info('Initializing database schema...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      workspace_path TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Project members table (for collaboration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    )
  `);

  // Files metadata table
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

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Execution history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      file_path TEXT NOT NULL,
      language TEXT NOT NULL,
      stdout TEXT,
      stderr TEXT,
      exit_code INTEGER,
      success INTEGER,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_history_user ON execution_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_history_project ON execution_history(project_id);
  `);

  logger.info('Database schema initialized successfully');
}

// Initialize on import
initDatabase();

/**
 * User operations
 */
export const userQueries = {
  create: db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `),

  findByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),

  findByUsername: db.prepare(`
    SELECT * FROM users WHERE username = ?
  `),

  findById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  update: db.prepare(`
    UPDATE users
    SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  deactivate: db.prepare(`
    UPDATE users SET is_active = 0 WHERE id = ?
  `),

  all: db.prepare(`
    SELECT id, username, email, is_active, created_at, updated_at
    FROM users
    WHERE is_active = 1
    ORDER BY created_at DESC
  `)
};

/**
 * Project operations
 */
export const projectQueries = {
  create: db.prepare(`
    INSERT INTO projects (name, description, owner_id, workspace_path)
    VALUES (?, ?, ?, ?)
  `),

  findById: db.prepare(`
    SELECT * FROM projects WHERE id = ?
  `),

  findByOwnerId: db.prepare(`
    SELECT * FROM projects WHERE owner_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `),

  findByUserId: db.prepare(`
    SELECT p.* FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE (p.owner_id = ? OR pm.user_id = ?)
    AND p.is_active = 1
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `),

  update: db.prepare(`
    UPDATE projects
    SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  delete: db.prepare(`
    UPDATE projects SET is_active = 0 WHERE id = ?
  `),

  all: db.prepare(`
    SELECT * FROM projects WHERE is_active = 1 ORDER BY created_at DESC
  `)
};

/**
 * Project member operations
 */
export const memberQueries = {
  add: db.prepare(`
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (?, ?, ?)
  `),

  remove: db.prepare(`
    DELETE FROM project_members
    WHERE project_id = ? AND user_id = ?
  `),

  findByProject: db.prepare(`
    SELECT u.id, u.username, u.email, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.joined_at ASC
  `),

  checkAccess: db.prepare(`
    SELECT 1 FROM project_members
    WHERE project_id = ? AND user_id = ?
    UNION
    SELECT 1 FROM projects
    WHERE id = ? AND owner_id = ?
  `)
};

/**
 * File operations
 */
export const fileQueries = {
  upsert: db.prepare(`
    INSERT INTO files (path, content, size, project_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(path)
    DO UPDATE SET
      content = excluded.content,
      size = excluded.size,
      last_modified = CURRENT_TIMESTAMP
  `),

  findByPath: db.prepare(`
    SELECT * FROM files
    WHERE path = ?
  `),

  findByProject: db.prepare(`
    SELECT * FROM files
    WHERE project_id = ?
    ORDER BY path ASC
  `),

  findAll: db.prepare(`
    SELECT * FROM files
    ORDER BY path ASC
  `),

  delete: db.prepare(`
    DELETE FROM files
    WHERE path = ?
  `),

  deleteByProject: db.prepare(`
    DELETE FROM files WHERE project_id = ?
  `),

  updatePath: db.prepare(`
    UPDATE files
    SET path = ?, last_modified = CURRENT_TIMESTAMP
    WHERE path = ?
  `)
};

/**
 * Session operations
 */
export const sessionQueries = {
  create: db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `),

  findByToken: db.prepare(`
    SELECT s.*, u.id as user_id, u.username, u.email, u.is_active
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `),

  delete: db.prepare(`
    DELETE FROM sessions WHERE token = ?
  `),

  deleteExpired: db.prepare(`
    DELETE FROM sessions WHERE expires_at < datetime('now')
  `),

  deleteByUser: db.prepare(`
    DELETE FROM sessions WHERE user_id = ?
  `)
};

/**
 * Execution history operations
 */
export const executionQueries = {
  create: db.prepare(`
    INSERT INTO execution_history
    (user_id, project_id, file_path, language, stdout, stderr, exit_code, success)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findByUser: db.prepare(`
    SELECT * FROM execution_history
    WHERE user_id = ?
    ORDER BY executed_at DESC
    LIMIT ?
  `),

  findByProject: db.prepare(`
    SELECT * FROM execution_history
    WHERE project_id = ?
    ORDER BY executed_at DESC
    LIMIT ?
  `),

  recent: db.prepare(`
    SELECT * FROM execution_history
    ORDER BY executed_at DESC
    LIMIT ?
  `)
};

// Clean up expired sessions periodically
setInterval(() => {
  try {
    const result = sessionQueries.deleteExpired.run();
    if (result.changes > 0) {
      logger.info(`Cleaned up ${result.changes} expired sessions`);
    }
  } catch (error) {
    logger.error('Failed to clean up expired sessions:', error);
  }
}, 3600000); // Every hour

export default db;
