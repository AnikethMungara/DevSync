import * as terminalService from '../services/terminalService.js';
import logger from '../utils/logger.js';

export async function startTerminal(req, res) {
  try {
    const { userId = 'anonymous' } = req.body;
    const sessionId = terminalService.createTerminalSession(userId);

    res.json({ sessionId });
    logger.info(`Terminal session created: ${sessionId} for user ${userId}`);
  } catch (err) {
    logger.error('Start terminal error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}
