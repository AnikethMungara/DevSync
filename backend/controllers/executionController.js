import { executeCode } from '../services/executionService.js';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.resolve(__dirname, '..', config.workspaceDir);

/**
 * Execute code from a file
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const runCode = async (req, res) => {
  try {
    const { filePath, language, code } = req.body;

    // Validation
    if (!filePath && !code) {
      return res.status(400).json({
        success: false,
        error: 'Either filePath or code is required'
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required (javascript or python)'
      });
    }

    // Validate language
    const validLanguages = ['javascript', 'python'];
    if (!validLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid language. Supported: ${validLanguages.join(', ')}`
      });
    }

    let targetFilePath = filePath;

    // If code is provided instead of filePath, create a temporary file
    if (code && !filePath) {
      const fs = await import('fs/promises');
      const extension = language === 'javascript' ? 'js' : 'py';
      const tempFileName = `temp_${Date.now()}.${extension}`;
      targetFilePath = path.join(WORKSPACE_DIR, tempFileName);

      await fs.writeFile(targetFilePath, code, 'utf-8');

      logger.info(`Created temporary file for execution: ${tempFileName}`);
    } else {
      // Ensure file path is within workspace
      const resolvedPath = path.resolve(WORKSPACE_DIR, filePath);
      if (!resolvedPath.startsWith(WORKSPACE_DIR)) {
        return res.status(403).json({
          success: false,
          error: 'File path must be within workspace directory'
        });
      }
      targetFilePath = resolvedPath;
    }

    logger.info(`Executing ${language} code from: ${targetFilePath}`);

    // Execute the code
    const result = await executeCode(targetFilePath, language);

    // Broadcast execution result via WebSocket if available
    if (req.app.locals.wss) {
      const message = JSON.stringify({
        type: 'execution:result',
        data: {
          filePath: filePath || 'temp',
          language,
          result,
          timestamp: new Date().toISOString()
        }
      });

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }

    // Return the execution result
    res.json({
      success: true,
      result
    });

  } catch (error) {
    logger.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute code'
    });
  }
};

/**
 * Get supported languages
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getSupportedLanguages = (req, res) => {
  res.json({
    success: true,
    languages: [
      {
        id: 'javascript',
        name: 'JavaScript',
        extensions: ['.js', '.mjs'],
        runtime: 'Node.js'
      },
      {
        id: 'python',
        name: 'Python',
        extensions: ['.py'],
        runtime: 'Python'
      }
    ]
  });
};
