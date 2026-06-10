const { v4: uuidv4 } = require('uuid');

class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  createRoom({ roomId, user }) {
    const id = roomId || `room-${uuidv4()}`;
    const room = this.rooms.get(id) || {
      id,
      participants: new Map(),
      files: new Map(),
      createdAt: new Date().toISOString()
    };

    if (user?.id) {
      room.participants.set(user.id, {
        ...user,
        joinedAt: new Date().toISOString(),
        isActive: true
      });
    }

    this.rooms.set(id, room);
    return this.serializeRoom(room);
  }

  joinRoom(roomId, user) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    room.participants.set(user.id, {
      ...user,
      joinedAt: new Date().toISOString(),
      isActive: true
    });

    return this.serializeRoom(room);
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants.delete(userId);
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  upsertFileContent(roomId, fileId, content, version = Date.now()) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.files.set(fileId, { fileId, content, version, updatedAt: new Date().toISOString() });
  }

  serializeRoom(room) {
    return {
      id: room.id,
      createdAt: room.createdAt,
      participants: Array.from(room.participants.values()),
      files: Array.from(room.files.values())
    };
  }
}

const roomService = new RoomService();
module.exports = { roomService };
