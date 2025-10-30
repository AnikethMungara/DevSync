import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { createReadStream } from 'fs';

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
  }

  logger.info(`File deleted: ${filePath}`);
}
