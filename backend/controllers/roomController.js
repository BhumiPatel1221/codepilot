const { roomService } = require('../services/roomService');

async function createRoom(req, res) {
  const { roomId, userId, userName } = req.body;
  const room = roomService.createRoom({
    roomId,
    user: {
      id: userId,
      name: userName
    }
  });
  res.status(201).json(room);
}

async function joinRoom(req, res) {
  const { roomId, userId, userName } = req.body;
  const room = roomService.joinRoom(roomId, {
    id: userId,
    name: userName
  });

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  return res.status(200).json(room);
}

module.exports = { createRoom, joinRoom };
