import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 8787,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  aiApiKey: process.env.AI_API_KEY || '',
  workspaceDir: process.env.WORKSPACE_DIR || './workspace',
  databasePath: process.env.DATABASE_PATH || './database.db',
  env: process.env.NODE_ENV || 'development',
  aiProvider: process.env.AI_PROVIDER || 'openai',
  aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
  terminalIdleTimeout: 15 * 60 * 1000,
  wsDisconnectTimeout: 10 * 1000,
  maxFileSize: 50 * 1024 * 1024,
  writeDebounceMs: 250,
  terminalMaxBuffer: 50 * 1024 * 1024
};

export default config;
