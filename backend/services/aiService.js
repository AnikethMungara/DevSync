import axios from 'axios';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const conversationCache = new Map();
const maxCacheSize = 50;

export async function chat(message, context, db) {
  const sanitizedContext = sanitizeContext(context);

  const prompt = buildPrompt(message, sanitizedContext);

  try {
    const response = await callLLM(prompt);

    storeConversation(db, message, response, sanitizedContext);

    return {
      role: 'assistant',
      content: response
    };
  } catch (err) {
    logger.error('AI chat error', { error: err.message });
    throw new Error('Failed to get AI response');
  }
}

function sanitizeContext(context) {
  if (!context) return null;

  let content = context.content || '';

  const secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/g,
    /password\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi
  ];

  secretPatterns.forEach(pattern => {
    content = content.replace(pattern, '[REDACTED]');
  });

  return {
    ...context,
    content
  };
}

function buildPrompt(message, context) {
  let prompt = message;

  if (context && context.content) {
    prompt = `Context (file: ${context.path}):\n\`\`\`\n${context.content.slice(0, 2000)}\n\`\`\`\n\nQuestion: ${message}`;
  }

  return prompt;
}

async function callLLM(prompt) {
  if (!config.aiApiKey) {
    throw new Error('AI_API_KEY not configured');
  }

  const cacheKey = prompt.slice(0, 100);
  if (conversationCache.has(cacheKey)) {
    logger.info('Returning cached AI response');
    return conversationCache.get(cacheKey);
  }

  if (config.aiProvider === 'openai') {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.aiModel,
        messages: [
          { role: 'system', content: 'You are a helpful coding assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${config.aiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0].message.content;

    if (conversationCache.size >= maxCacheSize) {
      const firstKey = conversationCache.keys().next().value;
      conversationCache.delete(firstKey);
    }
    conversationCache.set(cacheKey, content);

    return content;
  } else {
    throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
  }
}

function storeConversation(db, message, response, context) {
  try {
    const stmt = db.prepare(`
      INSERT INTO ai_chats (message, response, context, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);

    stmt.run(message, response, JSON.stringify(context));
  } catch (err) {
    logger.error('Failed to store conversation', { error: err.message });
  }
}
