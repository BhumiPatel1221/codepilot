const { listWorkspaces, getWorkspace, deleteWorkspace } = require('../services/workspaceService');
const { saveProject } = require('../services/projectService');

async function listWorkspacesHandler(req, res) {
  const userId = req.query.userId || null;
  const workspaces = await listWorkspaces(userId);
  return res.status(200).json({ workspaces });
}

async function getWorkspaceById(req, res) {
  const workspace = await getWorkspace(req.params.id);
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  return res.status(200).json(workspace);
}

async function saveProjectHandler(req, res) {
  const { workspaceId, name, files, description, language, visibility, ownerId, ownerName } = req.body;
  const workspace = await saveProject({ workspaceId, name, files, description, language, visibility, ownerId, ownerName });
  return res.status(200).json(workspace);
}

async function deleteWorkspaceHandler(req, res) {
  const deleted = await deleteWorkspace(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  return res.status(200).json({ success: true });
}

module.exports = { listWorkspacesHandler, getWorkspaceById, saveProjectHandler, deleteWorkspaceHandler };

