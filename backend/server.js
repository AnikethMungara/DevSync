import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import config from './config/config.js';
import logger from './utils/logger.js';
import filesRouter from './routes/files.js';
import projectsRouter from './routes/projects.js';
import searchRouter from './routes/search.js';
import terminalRouter from './routes/terminal.js';
import aiRouter from './routes/ai.js';
import { initWebSocket } from './ws/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

if (!fs.existsSync(config.workspaceDir)) {
  fs.mkdirSync(config.workspaceDir, { recursive: true });
}

// In-memory database mock for now (replace with actual DB later)
const db = {
  prepare: (sql) => ({
    run: (...args) => {},
    get: (...args) => null,
    all: (...args) => []
  }),
  exec: (sql) => {},
  close: () => {}
};

app.locals.db = db;

app.use('/api/files', filesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/search', searchRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/ai', aiRouter);

app.use('/extensions', express.static(path.join(__dirname, 'extensions')));

app.get('/extensions/manifest.json', (req, res) => {
  res.json([
    {
      id: 'wordcount',
      title: 'Word Count',
      entry: '/extensions/wordcount.js'
    }
  ]);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

initWebSocket(server, db);

server.listen(config.port, () => {
  logger.info(`DevSync backend listening on http://localhost:${config.port}`);
  logger.info(`WebSocket server available at ws://localhost:${config.port}/ws`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing gracefully');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason });
});
