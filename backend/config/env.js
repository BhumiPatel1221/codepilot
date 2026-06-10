const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // load root .env for GEMINI_API_KEY

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  BACKEND_PORT: Number(process.env.BACKEND_PORT || 5001),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:4028',
  EXECUTION_TIMEOUT_MS: Number(process.env.EXECUTION_TIMEOUT_MS || 7000),
  EXECUTION_MIN_TIMEOUT_MS: Number(process.env.EXECUTION_MIN_TIMEOUT_MS || 500),
  EXECUTION_MAX_TIMEOUT_MS: Number(process.env.EXECUTION_MAX_TIMEOUT_MS || 20000),
  EXECUTION_MAX_CODE_SIZE: Number(process.env.EXECUTION_MAX_CODE_SIZE || 200000),
  EXECUTION_CPU_LIMIT: process.env.EXECUTION_CPU_LIMIT || '0.5',
  EXECUTION_MEMORY_LIMIT: process.env.EXECUTION_MEMORY_LIMIT || '256m',
  EXECUTION_PIDS_LIMIT: Number(process.env.EXECUTION_PIDS_LIMIT || 64),
  EXECUTION_QUEUE_CONCURRENCY: Number(process.env.EXECUTION_QUEUE_CONCURRENCY || 2),
  EXECUTION_TMP_ROOT: process.env.EXECUTION_TMP_ROOT || ''
};

module.exports = { env };
