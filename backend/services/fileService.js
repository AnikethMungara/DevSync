import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { createReadStream } from 'fs';
import { fileQueries } from './databaseService.js';

const writeQueue = new Map();

export async function readFile(filePath) {
  const fullPath = path.join(config.workspaceDir, filePath);

  const stats = await fs.stat(fullPath);

  if (stats.size > 1024 * 1024) {
    return new Promise((resolve, reject) => {
      let content = '';
      const stream = createReadStream(fullPath, { encoding: 'utf8' });

      stream.on('data', (chunk) => {
        content += chunk;
      });

      stream.on('end', () => {
        resolve(content);
      });

      stream.on('error', reject);
    });
  }

  return await fs.readFile(fullPath, 'utf8');
}

export async function updateFile(filePath, content) {
  const fullPath = path.join(config.workspaceDir, filePath);

  if (writeQueue.has(fullPath)) {
    clearTimeout(writeQueue.get(fullPath));
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      try {
        await fs.writeFile(fullPath, content, 'utf8');
        writeQueue.delete(fullPath);

        // Sync to database
        try {
          const stats = await fs.stat(fullPath);
          fileQueries.upsert.run(filePath, content, stats.size, null);
        } catch (dbErr) {
          logger.warn(`Failed to sync file to database: ${filePath}`, { error: dbErr.message });
        }

        logger.info(`File updated: ${filePath}`);
        resolve();
      } catch (err) {
        writeQueue.delete(fullPath);
        reject(err);
      }
    }, config.writeDebounceMs);

    writeQueue.set(fullPath, timeoutId);
  });
}

export async function createFile(filePath, content = '', isDirectory = false) {
  const fullPath = path.join(config.workspaceDir, filePath);

  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });

  if (isDirectory) {
    await fs.mkdir(fullPath, { recursive: true });
  } else {
    await fs.writeFile(fullPath, content, 'utf8');

    // Sync to database (only for files, not directories)
    try {
      const stats = await fs.stat(fullPath);
      fileQueries.upsert.run(filePath, content, stats.size, null);
    } catch (dbErr) {
      logger.warn(`Failed to sync file to database: ${filePath}`, { error: dbErr.message });
    }
  }

  logger.info(`File created: ${filePath}`);
}

export async function deleteFile(filePath) {
  const fullPath = path.join(config.workspaceDir, filePath);

  const stats = await fs.stat(fullPath);

  if (stats.isDirectory()) {
    await fs.rm(fullPath, { recursive: true, force: true });
  } else {
    await fs.unlink(fullPath);

    // Remove from database
    try {
      fileQueries.delete.run(filePath);
    } catch (dbErr) {
      logger.warn(`Failed to remove file from database: ${filePath}`, { error: dbErr.message });
    }
  }

  logger.info(`File deleted: ${filePath}`);
}

export async function renameFile(oldPath, newPath) {
  const oldFullPath = path.join(config.workspaceDir, oldPath);
  const newFullPath = path.join(config.workspaceDir, newPath);

  // Ensure parent directory exists for new path
  const newDir = path.dirname(newFullPath);
  await fs.mkdir(newDir, { recursive: true });

  // Rename/move the file or directory
  await fs.rename(oldFullPath, newFullPath);

  // Update database
  try {
    fileQueries.updatePath.run(newPath, oldPath);
  } catch (dbErr) {
    logger.warn(`Failed to update file path in database: ${oldPath} -> ${newPath}`, { error: dbErr.message });
  }

  logger.info(`File renamed: ${oldPath} -> ${newPath}`);
}

export async function getFileTree(relativePath = '') {
  const fullPath = path.join(config.workspaceDir, relativePath);

  try {
    // Check if path exists
    await fs.access(fullPath);
  } catch (err) {
    // If workspace doesn't exist, create it and return empty tree
    if (err.code === 'ENOENT') {
      await fs.mkdir(fullPath, { recursive: true });
      return {
        name: 'workspace',
        path: '',
        type: 'folder',
        children: []
      };
    }
    throw err;
  }

  return await buildFileTree(fullPath, relativePath);
}

async function buildFileTree(fullPath, relativePath = '') {
  const stats = await fs.stat(fullPath);
  const name = path.basename(fullPath) || 'workspace';

  const node = {
    id: relativePath || 'root',
    name,
    path: relativePath,
    type: stats.isDirectory() ? 'folder' : 'file'
  };

  if (stats.isDirectory()) {
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      node.children = await Promise.all(
        entries
          .filter(entry => !entry.name.startsWith('.'))
          .sort((a, b) => {
            // Directories first, then alphabetically
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(async (entry) => {
            const childFullPath = path.join(fullPath, entry.name);
            const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            return buildFileTree(childFullPath, childRelativePath);
          })
      );
    } catch (err) {
      logger.warn(`Failed to read directory: ${fullPath}`, { error: err.message });
      node.children = [];
    }
  } else {
    node.size = stats.size;
  }

  return node;
}
