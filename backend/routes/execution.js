import express from 'express';
import { runCode, getSupportedLanguages } from '../controllers/executionController.js';

const router = express.Router();

/**
 * POST /api/execution/run
 * Execute code from a file or code string
 * Body: { filePath?: string, code?: string, language: string }
 */
router.post('/run', runCode);

/**
 * GET /api/execution/languages
 * Get list of supported languages
 */
router.get('/languages', getSupportedLanguages);

export default router;
