const express = require('express');

const { chat } = require('../controllers/aiController');

const router = express.Router();

router.post('/ai/chat', chat);

module.exports = router;
