import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';

export async function search(projectId, query) {
  const projectPath = path.join(config.workspaceDir, projectId);
  const results = [];

  await searchDirectory(projectPath, query, projectId, results);

  return results;
}

async function searchDirectory(dirPath, query, projectId, results, relativePath = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          path: relPath,
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          match: 'filename'
        });
      }

      if (entry.isDirectory()) {
        await searchDirectory(fullPath, query, projectId, results, relPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        if (stats.size < 1024 * 1024) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
              const lines = content.split('\n');
              const matchingLines = [];

              lines.forEach((line, index) => {
                if (line.toLowerCase().includes(query.toLowerCase())) {
                  matchingLines.push({
                    line: index + 1,
                    content: line.trim()
                  });
                }
              });

              if (matchingLines.length > 0) {
                results.push({
                  path: relPath,
                  name: entry.name,
                  type: 'file',
                  match: 'content',
                  lines: matchingLines.slice(0, 10)
                });
              }
            }
          } catch (err) {
            logger.warn(`Failed to search file content: ${fullPath}`, { error: err.message });
          }
        }
      }
    }
  } catch (err) {
    logger.error(`Search directory error: ${dirPath}`, { error: err.message });
  }
}
