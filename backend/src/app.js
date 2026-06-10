const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { env } = require('../config/env');
const { corsOptions } = require('../config/cors');
const { globalLimiter } = require('../middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const apiRouter = require('../routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(globalLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'codepilot-backend' });
  });

  app.use('/', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
