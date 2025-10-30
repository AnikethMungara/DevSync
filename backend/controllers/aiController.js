import * as aiService from '../services/aiService.js';
import logger from '../utils/logger.js';

const rateLimits = new Map();

export async function chat(req, res) {
  try {
    const ip = req.ip;
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }

    const requests = rateLimits.get(ip).filter(t => now - t < 60000);

    if (requests.length >= 3) {
      return res.status(429).json({ error: 'Rate limit exceeded: 3 requests per minute' });
    }

    requests.push(now);
    rateLimits.set(ip, requests);

    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await aiService.chat(message, context, req.app.locals.db);

    res.json(response);
  } catch (err) {
    logger.error('AI chat error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}
