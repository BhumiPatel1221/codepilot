const { spawnSync } = require('child_process');
const { runnerBuilds } = require('./languageRuntimes');

for (const runner of runnerBuilds()) {
  const command = ['build', '-t', runner.image, runner.context];
  const result = spawnSync('docker', command, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('All runner images built successfully.');
