const { env } = require('../config/env');
const { ExecutionQueue } = require('./ExecutionQueue');
const { DockerExecutor } = require('./DockerExecutor');

const queue = new ExecutionQueue(env.EXECUTION_QUEUE_CONCURRENCY);
const executor = new DockerExecutor();

async function executeInQueue(payload) {
  return queue.enqueue(() => executor.execute(payload));
}

module.exports = { executeInQueue };
