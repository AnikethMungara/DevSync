import * as projectService from '../services/projectService.js';
import logger from '../utils/logger.js';

export async function listProjects(req, res) {
  try {
    const projects = await projectService.listProjects();
    res.json(projects);
  } catch (err) {
    logger.error('List projects error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}

export async function getProjectTree(req, res) {
  try {
    const { id } = req.params;
    const tree = await projectService.getProjectTree(id);
    res.json(tree);
  } catch (err) {
    logger.error('Get project tree error', { error: err.message, projectId: req.params.id });
    res.status(500).json({ error: err.message });
  }
}
