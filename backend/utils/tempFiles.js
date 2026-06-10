const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { env } = require('../config/env');

async function createTempWorkspace() {
  const base = env.EXECUTION_TMP_ROOT || path.join(os.tmpdir(), 'codepilot-exec');
  await fs.mkdir(base, { recursive: true });
  const dir = path.join(base, uuidv4());
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  return dir;
}

async function cleanupPath(targetPath) {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // ignore cleanup failures
  }
}

module.exports = { createTempWorkspace, cleanupPath };
