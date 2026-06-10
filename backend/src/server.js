const http = require('http');

const { createApp } = require('./app');
const { env } = require('../config/env');
const { setupSocketServer } = require('../sockets/collaborationSocket');
const { logger } = require('../utils/logger');

const app = createApp();
const server = http.createServer(app);
const io = setupSocketServer(server);
app.set('io', io);

server.listen(env.BACKEND_PORT, () => {
  logger.info(`CodePilot backend listening on :${env.BACKEND_PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes("Cannot read properties of undefined (reading 'forEach')")) {
    logger.warn('Ignored node-pty unhandled rejection on Windows');
  } else {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
});
