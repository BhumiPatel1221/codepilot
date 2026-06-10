const fs = require('fs/promises');
const path = require('path');

class SafeJsonStore {
  constructor(filePath, fallback = {}) {
    this.filePath = filePath;
    this.fallback = fallback;
    this.lock = Promise.resolve();
  }

  async ensureFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify(this.fallback, null, 2), 'utf8');
    }
  }

  async read() {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(raw || JSON.stringify(this.fallback));
  }

  async write(data) {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async withLock(work) {
    const previousLock = this.lock;
    let release;
    this.lock = new Promise((resolve) => {
      release = resolve;
    });

    await previousLock;
    try {
      return await work();
    } finally {
      release();
    }
  }
}

module.exports = { SafeJsonStore };
