const { env } = require('./env');

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (env.NODE_ENV === 'development' || origin === env.FRONTEND_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

module.exports = { corsOptions };
