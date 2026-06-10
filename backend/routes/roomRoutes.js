const express = require('express');

const { createRoom, joinRoom } = require('../controllers/roomController');
const { validateRequired } = require('../middleware/validateRequest');

const router = express.Router();

router.post('/create-room', validateRequired(['userId', 'userName']), createRoom);
router.post('/join-room', validateRequired(['roomId', 'userId', 'userName']), joinRoom);

module.exports = router;
