import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const treeCache = new Map();

export async function listProjects() {
  try {
    const entries = await fs.readdir(config.workspaceDir, { withFileTypes: true });

    const projects = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        id: entry.name,
        name: entry.name,
        path: entry.name
      }));

    return projects;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export async function getProjectTree(projectId) {
  const cacheKey = projectId;

  if (treeCache.has(cacheKey)) {
    const cached = treeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5000) {
      return cached.tree;
    }
  }

  const projectPath = path.join(config.workspaceDir, projectId);

  try {
    await fs.access(projectPath);
  } catch {
    throw new Error(`Project not found: ${projectId}`);
  }

  const tree = await buildTree(projectPath, projectId);

  treeCache.set(cacheKey, { tree, timestamp: Date.now() });

  return tree;
}

async function buildTree(fullPath, relativePath = '') {
  const stats = await fs.stat(fullPath);

  const node = {
    name: path.basename(fullPath),
    path: relativePath,
    type: stats.isDirectory() ? 'directory' : 'file'
  };

  if (stats.isDirectory()) {
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      node.children = await Promise.all(
        entries
          .filter(entry => !entry.name.startsWith('.'))
          .map(entry => {
            const childPath = path.join(fullPath, entry.name);
            const childRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            return buildTree(childPath, childRelative);
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

export function invalidateTreeCache(projectId) {
  treeCache.delete(projectId);
}
