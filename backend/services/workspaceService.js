const path = require('path');

const { SafeJsonStore } = require('../utils/safeJsonStore');

const store = new SafeJsonStore(path.resolve(__dirname, '../data/workspaces.json'), { workspaces: {} });

async function listWorkspaces(userId) {
  const data = await store.read();
  const all = Object.values(data.workspaces || {});
  if (userId) {
    return all.filter(ws => ws.ownerId === userId || (ws.collaborators || []).some(c => c.id === userId));
  }
  return all;
}

async function getWorkspace(id) {
  const data = await store.read();
  return data.workspaces[id] || null;
}

async function saveWorkspace(workspace) {
  return store.withLock(async () => {
    const data = await store.read();
    data.workspaces[workspace.id] = {
      ...workspace,
      updatedAt: new Date().toISOString()
    };
    await store.write(data);
    return data.workspaces[workspace.id];
  });
}

async function deleteWorkspace(id) {
  return store.withLock(async () => {
    const data = await store.read();
    if (!data.workspaces[id]) return false;
    delete data.workspaces[id];
    await store.write(data);
    return true;
  });
}

module.exports = { listWorkspaces, getWorkspace, saveWorkspace, deleteWorkspace };

