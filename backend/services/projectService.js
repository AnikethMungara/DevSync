import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { projectQueries, memberQueries } from './databaseService.js';

const treeCache = new Map();

/**
 * List all projects for a user
 * @param {number|null} userId - User ID, or null for all projects
 * @returns {Array} Array of project objects
 */
export async function listProjects(userId = null) {
  try {
    let dbProjects;

    if (userId) {
      // Get projects owned by or accessible to the user
      dbProjects = projectQueries.findByUserId.all(userId, userId);
    } else {
      // Get all active projects (for backward compatibility)
      dbProjects = projectQueries.all.all();
    }

    // Also check filesystem for projects not in database (legacy support)
    try {
      const fsEntries = await fs.readdir(config.workspaceDir, { withFileTypes: true });
      const fsProjects = fsEntries
        .filter(entry => entry.isDirectory())
        .filter(entry => !dbProjects.find(p => p.name === entry.name))
        .map(entry => ({
          id: entry.name,
          name: entry.name,
          path: entry.name,
          is_legacy: true
        }));

      // Merge database projects with filesystem projects
      return [...dbProjects, ...fsProjects];
    } catch (err) {
      if (err.code === 'ENOENT') {
        // If workspace dir doesn't exist, return only DB projects
        return dbProjects;
      }
      throw err;
    }
  } catch (err) {
    logger.error('Error listing projects:', err);
    throw err;
  }
}

/**
 * Create a new project
 * @param {Object} projectData
 * @param {string} projectData.name - Project name
 * @param {string} projectData.description - Project description
 * @param {number} projectData.ownerId - Owner user ID
 * @returns {Object} Created project
 */
export async function createProject({ name, description, ownerId }) {
  // Generate workspace path
  const workspacePath = path.join(config.workspaceDir, name.replace(/[^a-zA-Z0-9-_]/g, '_'));

  // Create directory
  await fs.mkdir(workspacePath, { recursive: true });

  // Insert into database
  const result = projectQueries.create.run(name, description || '', ownerId, workspacePath);

  const project = projectQueries.findById.get(result.lastInsertRowid);

  logger.info(`Project created: ${name} by user ${ownerId}`);

  return project;
}

/**
 * Get a project by ID
 * @param {number} projectId - Project ID
 * @param {number|null} userId - User ID for access check
 * @returns {Object|null} Project object or null
 */
export function getProject(projectId, userId = null) {
  const project = projectQueries.findById.get(projectId);

  if (!project) {
    return null;
  }

  // Check access if userId is provided
  if (userId) {
    const hasAccess = memberQueries.checkAccess.get(projectId, userId, projectId, userId);
    if (!hasAccess) {
      return null;
    }
  }

  return project;
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
