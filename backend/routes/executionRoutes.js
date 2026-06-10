const express = require('express');

const { executeCode } = require('../controllers/executionController');
const { executionLimiter } = require('../middleware/rateLimiter');
const { validateExecuteRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post('/execute', executionLimiter, validateExecuteRequest, executeCode);

module.exports = router;
