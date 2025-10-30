import * as searchService from '../services/searchService.js';
import logger from '../utils/logger.js';

export async function search(req, res) {
  try {
    const { projectId, q } = req.query;

    if (!projectId || !q) {
      return res.status(400).json({ error: 'projectId and q are required' });
    }

    const results = await searchService.search(projectId, q);
    res.json(results);
  } catch (err) {
    logger.error('Search error', { error: err.message, query: req.query });
    res.status(500).json({ error: err.message });
  }
}
