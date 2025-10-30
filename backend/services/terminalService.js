let pty;
try {
  pty = await import('node-pty');
} catch (err) {
  console.warn('node-pty not available - terminal features will be disabled');
}

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import os from 'os';

const sessions = new Map();
const dangerousCommands = ['del', 'rd', 'format', 'shutdown', 'rm -rf /', 'rmdir /s'];

export function createTerminalSession(userId) {
  if (!pty) {
    throw new Error('Terminal service not available - node-pty is not installed');
  }

  const sessionId = uuidv4();

  const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: config.workspaceDir,
    env: process.env
  });

  const session = {
    id: sessionId,
    userId,
    pty: ptyProcess,
    lastActivity: Date.now(),
    buffer: []
  };

  ptyProcess.onData((data) => {
    session.lastActivity = Date.now();
    session.buffer.push(data);

    if (session.buffer.length > 1000) {
      session.buffer.shift();
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    logger.info(`Terminal session exited: ${sessionId}, code: ${exitCode}`);
    sessions.delete(sessionId);
  });

  sessions.set(sessionId, session);

  const idleCheck = setInterval(() => {
    if (Date.now() - session.lastActivity > config.terminalIdleTimeout) {
      logger.info(`Terminal session idle timeout: ${sessionId}`);
      ptyProcess.kill();
      sessions.delete(sessionId);
      clearInterval(idleCheck);
    }
  }, 60000);

  return sessionId;
}

export function handleTerminalConnection(ws, channel) {
  const sessionId = channel.replace('terminal:', '');
  const session = sessions.get(sessionId);

  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
    ws.close();
    return;
  }

  session.buffer.forEach(data => {
    ws.send(JSON.stringify({ type: 'data', data }));
  });

  const dataHandler = (data) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'data', data }));
    }
  };

  session.pty.onData(dataHandler);

  ws.on('message', (msg) => {
    try {
      const message = JSON.parse(msg.toString());

      if (message.type === 'input') {
        const input = message.data;

        const isDangerous = dangerousCommands.some(cmd =>
          input.toLowerCase().includes(cmd.toLowerCase())
        );

        if (isDangerous) {
          ws.send(JSON.stringify({
            type: 'data',
            data: '\r\nCommand blocked for safety reasons\r\n'
          }));
          return;
        }

        session.pty.write(input);
        session.lastActivity = Date.now();
      } else if (message.type === 'resize') {
        session.pty.resize(message.cols || 80, message.rows || 30);
      }
    } catch (err) {
      logger.error('Terminal message error', { error: err.message });
    }
  });

  ws.on('close', () => {
    logger.info(`Terminal WS closed: ${sessionId}`);
  });
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}
