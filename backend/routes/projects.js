import express from 'express';
import * as projectsController from '../controllers/projectsController.js';

const router = express.Router();

router.get('/', projectsController.listProjects);
router.get('/:id/tree', projectsController.getProjectTree);

export default router;
