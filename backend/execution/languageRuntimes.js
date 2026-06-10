const path = require('path');

const languageRuntimes = {
  python: {
    image: 'codepilot-runner-python:latest',
    filename: 'main.py',
    command: (filename) => ['/runner/run.sh', `/workspace/${filename}`]
  },
  javascript: {
    image: 'codepilot-runner-node:latest',
    filename: 'main.js',
    command: (filename) => ['/runner/run.sh', `/workspace/${filename}`, 'javascript']
  },
  typescript: {
    image: 'codepilot-runner-node:latest',
    filename: 'main.ts',
    command: (filename) => ['/runner/run.sh', `/workspace/${filename}`, 'typescript']
  },
  java: {
    image: 'codepilot-runner-java:latest',
    filename: 'Main.java',
    command: (filename) => ['/runner/run.sh', `/workspace/${filename}`]
  },
  cpp: {
    image: 'codepilot-runner-cpp:latest',
    filename: 'main.cpp',
    command: (filename) => ['/runner/run.sh', `/workspace/${filename}`]
  },
  terminal: {
    image: 'codepilot-runner-node:latest',
    filename: 'terminal',
    command: (cmd) => ['/bin/sh', '-c', cmd]
  }
};

function runnerBuilds() {
  return [
    { image: 'codepilot-runner-python:latest', context: path.resolve(__dirname, '../../runners/python') },
    { image: 'codepilot-runner-node:latest', context: path.resolve(__dirname, '../../runners/node') },
    { image: 'codepilot-runner-java:latest', context: path.resolve(__dirname, '../../runners/java') },
    { image: 'codepilot-runner-cpp:latest', context: path.resolve(__dirname, '../../runners/cpp') }
  ];
}

module.exports = { languageRuntimes, runnerBuilds };
