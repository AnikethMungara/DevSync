import logger from '../utils/logger.js';

/**
 * Get all problems/diagnostics for the current workspace
 * In a real implementation, this would integrate with a linter/type-checker
 * For now, returns an empty array (no hardcoded examples)
 */
export async function getProblems(req, res) {
  try {
    // TODO: Integrate with actual linter/type-checker (e.g., ESLint, TypeScript)
    // For now, return empty array - no hardcoded examples
    const problems = [];

    logger.info('Problems fetched', { count: problems.length });
    res.json(problems);
  } catch (error) {
    logger.error('Error fetching problems', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
}
