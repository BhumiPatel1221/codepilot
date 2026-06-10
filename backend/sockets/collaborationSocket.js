const { Server } = require('socket.io');
const pty = require('node-pty');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const { env } = require('../config/env');
const { roomService } = require('../services/roomService');
const { languageRuntimes } = require('../execution/languageRuntimes');

function setupSocketServer(httpServer) {
  const ptySessions = new Map();
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('room:join', ({ roomId, user }) => {
      if (!roomId || !user?.id) return;
      socket.join(roomId);
      roomService.createRoom({ roomId, user });
      io.to(roomId).emit('presence:update', { roomId, user, status: 'joined' });
    });

    socket.on('room:leave', ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      socket.leave(roomId);
      roomService.leaveRoom(roomId, userId);
      io.to(roomId).emit('presence:update', { roomId, userId, status: 'left' });
    });

    socket.on('editor:change', ({ roomId, fileId, content, version }) => {
      if (!roomId || !fileId || typeof content !== 'string') return;
      roomService.upsertFileContent(roomId, fileId, content, version);
      socket.to(roomId).emit('editor:patch', { roomId, fileId, content, version });
    });

    socket.on('workspace:files:update', async ({ roomId, files }) => {
      if (!roomId || !files) return;
      socket.to(roomId).emit('workspace:files:update', { roomId, files });
      
      const tempDir = path.join(os.tmpdir(), 'codepilot-pty', roomId);
      try {
        await fs.mkdir(tempDir, { recursive: true });
        const writeNode = async (node, currentPath) => {
          const fullPath = path.join(currentPath, node.name);
          if (node.type === 'folder') {
            await fs.mkdir(fullPath, { recursive: true });
            for (const child of node.children || []) {
              await writeNode(child, fullPath);
            }
          } else {
            await fs.writeFile(fullPath, node.content || '', { encoding: 'utf8', mode: 0o600 });
          }
        };
        for (const file of files) {
          await writeNode(file, tempDir);
        }
      } catch (e) {
        console.error('Failed to sync files to pty directory:', e);
      }
    });

    socket.on('cursor:update', ({ roomId, fileId, userId, line, col }) => {
      if (!roomId || !fileId || !userId) return;
      socket.to(roomId).emit('cursor:update', { roomId, fileId, userId, line, col });
    });

    socket.on('chat:send', ({ roomId, message }) => {
      if (!roomId || !message) return;
      io.to(roomId).emit('chat:message', {
        roomId,
        ...message,
        sentAt: new Date().toISOString()
      });
    });

    socket.on('terminal:subscribe', ({ executionId }) => {
      if (!executionId) return;
      socket.join(`execution:${executionId}`);
    });

    socket.on('pty:stop', () => {
      const ptyProcess = ptySessions.get(socket.id);
      if (ptyProcess) {
        ptyProcess.kill();
        ptySessions.delete(socket.id);
      }
    });

    socket.on('pty:start', async ({ workspaceId, files, language }) => {
      if (ptySessions.has(socket.id)) {
        const ptyProcess = ptySessions.get(socket.id);
        ptyProcess.kill();
        ptySessions.delete(socket.id);
      }
      
      const tempDir = path.join(os.tmpdir(), 'codepilot-pty', workspaceId || `tmp-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      if (files) {
        const writeNode = async (node, currentPath) => {
          const fullPath = path.join(currentPath, node.name);
          if (node.type === 'folder') {
            await fs.mkdir(fullPath, { recursive: true });
            for (const child of node.children || []) {
              await writeNode(child, fullPath);
            }
          } else {
            await fs.writeFile(fullPath, node.content || '', { encoding: 'utf8', mode: 0o600 });
          }
        };
        for (const file of files) {
          await writeNode(file, tempDir);
        }
      }
      
      const dockerImage = languageRuntimes[language?.toLowerCase()]?.image || 'codepilot-runner-node:latest';

      try {
        const dockerCmd = os.platform() === 'win32' ? 'docker.exe' : 'docker';
        const ptyProcess = pty.spawn(dockerCmd, [
          'run', '-it', '--rm',
          '-v', `${tempDir}:/workspace:rw`,
          '-w', '/workspace',
          dockerImage,
          '/bin/bash'
        ], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
        });

        ptyProcess.onData((data) => {
          socket.emit('pty:data', data);
        });
        
        ptyProcess.onExit(() => {
          if (ptySessions.get(socket.id) === ptyProcess) {
            ptySessions.delete(socket.id);
            socket.emit('pty:data', '\r\n[Terminal closed]\r\n');
          }
        });

        ptySessions.set(socket.id, ptyProcess);
      } catch (e) {
        console.error('PTY Spawn Error:', e);
        socket.emit('pty:data', `\r\n[Error starting terminal: ${e.message}]\r\n`);
      }
    });

    socket.on('pty:data', (data) => {
      const ptyProcess = ptySessions.get(socket.id);
      if (ptyProcess) {
        if (typeof data === 'string') {
          ptyProcess.write(data);
        } else if (data && typeof data.data === 'string') {
          // Fallback if an object was accidentally sent
          ptyProcess.write(data.data);
        }
      } else {
        socket.emit('pty:data', '\r\n\x1b[31m[Error: Terminal session disconnected. Click the + button to restart]\x1b[0m\r\n');
      }
    });

    socket.on('pty:resize', ({ cols, rows }) => {
      const ptyProcess = ptySessions.get(socket.id);
      if (ptyProcess) {
        try {
          ptyProcess.resize(cols, rows);
        } catch (e) {}
      }
    });

    socket.on('disconnecting', () => {
      const ptyProcess = ptySessions.get(socket.id);
      if (ptyProcess) {
        ptyProcess.kill();
        ptySessions.delete(socket.id);
      }
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          io.to(roomId).emit('presence:update', { roomId, socketId: socket.id, status: 'disconnected' });
        }
      });
    });
  });

  return io;
}

module.exports = { setupSocketServer };
