import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import * as Y from 'yjs';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { handleTerminalConnection } from '../services/terminalService.js';

const channels = new Map();
const userPresence = new Map();
const yjsDocs = new Map();

export function initWebSocket(server, db) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('user') || 'anonymous';
    const channel = url.searchParams.get('channel') || 'presence';

    logger.info(`WS connected: user=${userId}, channel=${channel}`);

    ws.userId = userId;
    ws.channel = channel;
    ws.isAlive = true;

    if (channel.startsWith('collab:')) {
      const docName = channel.replace('collab:', '');
      if (!yjsDocs.has(docName)) {
        yjsDocs.set(docName, new Y.Doc());
      }
      setupWSConnection(ws, req, { docName, gc: true });
    } else if (channel.startsWith('terminal:')) {
      handleTerminalConnection(ws, channel);
    } else if (channel === 'presence') {
      if (!channels.has(channel)) {
        channels.set(channel, new Set());
      }
      channels.get(channel).add(ws);
      userPresence.set(userId, ws);

      broadcast(channel, {
        type: 'userJoined',
        userId,
        timestamp: Date.now()
      }, ws);
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message, channel);
      } catch (err) {
        logger.error('WS message parse error', { error: err.message });
      }
    });

    ws.on('close', () => {
      logger.info(`WS disconnected: user=${userId}, channel=${channel}`);

      if (channels.has(channel)) {
        channels.get(channel).delete(ws);
        if (channels.get(channel).size === 0) {
          channels.delete(channel);
        }
      }

      if (userPresence.get(userId) === ws) {
        userPresence.delete(userId);
      }

      if (channel === 'presence') {
        broadcast(channel, {
          type: 'userLeft',
          userId,
          timestamp: Date.now()
        });
      }

      setTimeout(() => {
        if (!userPresence.has(userId)) {
          logger.info(`User ${userId} cleanup after disconnect timeout`);
        }
      }, config.wsDisconnectTimeout);
    });

    ws.on('error', (err) => {
      logger.error('WS error', { userId, channel, error: err.message });
    });
  });

  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.warn(`Terminating inactive WS: ${ws.userId}`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  logger.info('WebSocket server initialized on /ws');
}

function handleMessage(ws, message, channel) {
  if (message.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
  } else if (message.type === 'broadcast') {
    broadcast(channel, message.payload, ws);
  }
}

function broadcast(channel, data, excludeWs = null) {
  if (!channels.has(channel)) return;

  const payload = JSON.stringify(data);
  channels.get(channel).forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(payload);
    }
  });
}

export { channels, userPresence, broadcast };
