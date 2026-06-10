const express = require('express');

const { listWorkspacesHandler, getWorkspaceById, saveProjectHandler, deleteWorkspaceHandler } = require('../controllers/workspaceController');
const { validateRequired } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/workspaces', listWorkspacesHandler);
router.get('/workspace/:id', getWorkspaceById);
router.post('/save-project', validateRequired(['name']), saveProjectHandler);
router.delete('/workspace/:id', deleteWorkspaceHandler);

module.exports = router;

