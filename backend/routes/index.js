const express = require('express');

const roomRoutes = require('./roomRoutes');
const workspaceRoutes = require('./workspaceRoutes');
const executionRoutes = require('./executionRoutes');
const aiRoutes = require('./aiRoutes');
const userRoutes = require('./userRoutes');
const invitationRoutes = require('./invitationRoutes');

const router = express.Router();

router.use('/api', roomRoutes);
router.use('/api', workspaceRoutes);
router.use('/api', executionRoutes);
router.use('/api', aiRoutes);
router.use('/api', userRoutes);
router.use('/api', invitationRoutes);

module.exports = router;
