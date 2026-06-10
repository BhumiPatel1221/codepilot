class ExecutionQueue {
  constructor(concurrency = 2) {
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.running = 0;
    this.pending = [];
  }

  enqueue(taskFn) {
    return new Promise((resolve, reject) => {
      this.pending.push({ taskFn, resolve, reject });
      this.drain();
    });
  }

  drain() {
    while (this.running < this.concurrency && this.pending.length > 0) {
      const task = this.pending.shift();
      this.running += 1;

      Promise.resolve()
        .then(() => task.taskFn())
        .then(task.resolve)
        .catch(task.reject)
        .finally(() => {
          this.running -= 1;
          this.drain();
        });
    }
  }
}

module.exports = { ExecutionQueue };
