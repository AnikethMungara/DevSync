import axios from 'axios';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const conversationCache = new Map();
const maxCacheSize = 50;

export async function chat(message, context) {
  const sanitizedContext = sanitizeContext(context);

  const prompt = buildPrompt(message, sanitizedContext);

  try {
    const response = await callLLM(prompt);

    return {
      role: 'assistant',
      content: response
    };
  } catch (err) {
    logger.error('AI service error', { error: err.message });
    throw err;
  }
}

function sanitizeContext(context) {
  if (!context) return null;

  let content = context.content || '';

  const secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/g,
    /password\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi
  ];

  secretPatterns.forEach(pattern => {
    content = content.replace(pattern, '[REDACTED]');
  });

  return {
    ...context,
    content: content.slice(0, 5000)
  };
}

function buildPrompt(message, context) {
  let prompt = message;

  if (context && context.content) {
    prompt = `You are a helpful coding assistant for a collaborative IDE platform.

File context: ${context.path || 'unknown'}

\`\`\`
${context.content}
\`\`\`

User question: ${message}

Please provide a helpful, concise answer.`;
  }

  return prompt;
}

async function callLLM(prompt) {
  if (!config.aiApiKey) {
    return 'AI assistant is not configured. Please set AI_API_KEY environment variable.';
  }

  const cacheKey = prompt.slice(0, 100);
  if (conversationCache.has(cacheKey)) {
    logger.info('Returning cached AI response');
    return conversationCache.get(cacheKey);
  }

  try {
    if (config.aiProvider === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.aiModel,
          messages: [
            { role: 'system', content: 'You are a helpful coding assistant for DevSync IDE.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${config.aiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
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
  } catch (err) {
    if (err.response) {
      logger.error('LLM API error', {
        status: err.response.status,
        data: err.response.data
      });
      throw new Error(`AI service error: ${err.response.status}`);
    } else {
      throw err;
    }
  }
}

export { sanitizeContext, buildPrompt };
