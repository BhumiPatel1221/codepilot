const { v4: uuidv4 } = require('uuid');

const { saveWorkspace } = require('./workspaceService');

async function saveProject({ workspaceId, name, files, description, language, visibility, ownerId, ownerName }) {
  const id = workspaceId || `ws-${uuidv4()}`;
  return saveWorkspace({
    id,
    name,
    files,
    description: description || '',
    language: language || 'typescript',
    visibility: visibility || 'private',
    ownerId: ownerId || null,
    ownerName: ownerName || '',
    lastSavedAt: new Date().toISOString()
  });
}

module.exports = { saveProject };

