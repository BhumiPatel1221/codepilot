const fs = require('fs/promises');
const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { env } = require('../config/env');
const { languageRuntimes } = require('./languageRuntimes');
const { createTempWorkspace, cleanupPath } = require('../utils/tempFiles');

function runCommand(cmd, args = []) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => resolve({ code, stderr }));
    child.on('error', () => resolve({ code: 1, stderr: 'failed to execute command' }));
  });
}

class DockerExecutor {
  async execute({ language, code, stdin = '', onOutput, files, activeFilePath }) {
    const runtime = languageRuntimes[language];
    if (!runtime) {
      throw new Error('Unsupported language runtime');
    }

    const tempDir = await createTempWorkspace();
    
    if (files && files.length > 0) {
      const writeNode = async (node, currentPath) => {
        const fullPath = path.join(currentPath, node.name);
        if (node.type === 'folder') {
          await fs.mkdir(fullPath, { recursive: true });
          if (node.children) {
            for (const child of node.children) {
              await writeNode(child, fullPath);
            }
          }
        } else {
          await fs.writeFile(fullPath, node.content || '', { encoding: 'utf8', mode: 0o600 });
        }
      };
      for (const node of files) {
        await writeNode(node, tempDir);
      }
    } else {
      const sourcePath = path.join(tempDir, runtime.filename);
      await fs.writeFile(sourcePath, code || '', { encoding: 'utf8', mode: 0o600 });
    }

    const containerName = `codepilot-exec-${uuidv4()}`;
    const dockerArgs = [
      'run',
      '--rm',
      '--name',
      containerName,
      '--network',
      'none',
      '--cpus',
      String(env.EXECUTION_CPU_LIMIT),
      '--memory',
      env.EXECUTION_MEMORY_LIMIT,
      '--memory-swap',
      env.EXECUTION_MEMORY_LIMIT,
      '--pids-limit',
      String(env.EXECUTION_PIDS_LIMIT),
      '--read-only',
      '--security-opt',
      'no-new-privileges',
      '--tmpfs',
      '/tmp:rw,noexec,nosuid,size=64m',
      '-v',
      `${tempDir}:/workspace:rw`,
      runtime.image,
      ...(typeof runtime.command === 'function' ? runtime.command(activeFilePath || runtime.filename) : runtime.command)
    ];

    const boundedTimeoutMs = Math.min(
      Math.max(env.EXECUTION_TIMEOUT_MS, env.EXECUTION_MIN_TIMEOUT_MS),
      env.EXECUTION_MAX_TIMEOUT_MS
    );

    return new Promise((resolve) => {
      const startedAt = Date.now();
      const child = spawn('docker', dockerArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let containerCleanup = Promise.resolve({ code: 0, stderr: '' });

      const timeoutHandle = setTimeout(async () => {
        timedOut = true;
        child.kill('SIGKILL');
        containerCleanup = runCommand('docker', ['rm', '-f', containerName]);
      }, boundedTimeoutMs);

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        if (onOutput) onOutput({ stream: 'stdout', chunk: text });
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        if (onOutput) onOutput({ stream: 'stderr', chunk: text });
      });

      child.on('error', async (err) => {
        clearTimeout(timeoutHandle);
        await cleanupPath(tempDir);
        resolve({
          exitCode: 1,
          timedOut,
          durationMs: Date.now() - startedAt,
          stdout,
          stderr: `${stderr}\n${err.message}`.trim()
        });
      });

      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.on('close', async (exitCode) => {
        clearTimeout(timeoutHandle);
        const cleanupResult = await containerCleanup;
        if (cleanupResult.code !== 0 && timedOut) {
          stderr = `${stderr}\nContainer cleanup warning: ${cleanupResult.stderr}`.trim();
        }
        await cleanupPath(tempDir);
        resolve({
          exitCode: exitCode ?? 1,
          timedOut,
          durationMs: Date.now() - startedAt,
          stdout,
          stderr
        });
      });
    });
  }
}

module.exports = { DockerExecutor };
