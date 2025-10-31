import express from 'express';
import * as problemsController from '../controllers/problemsController.js';

const router = express.Router();

router.get('/', problemsController.getProblems);

export default router;
