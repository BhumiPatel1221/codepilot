const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { SafeJsonStore } = require('../utils/safeJsonStore');

const store = new SafeJsonStore(path.resolve(__dirname, '../data/invitations.json'), { invitations: {} });

async function createInvitation({ workspaceId, inviterId, inviterEmail, inviteeEmail, role, workspaceName }) {
  return store.withLock(async () => {
    const data = await store.read();
    const id = uuidv4();
    const invitation = {
      id,
      workspaceId,
      inviterId,
      inviterEmail,
      inviteeEmail,
      role,
      workspaceName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    data.invitations[id] = invitation;
    await store.write(data);
    return invitation;
  });
}

async function getInvitationsForEmail(email) {
  const data = await store.read();
  return Object.values(data.invitations || {}).filter(
    inv => inv.inviteeEmail === email && inv.status === 'pending'
  );
}

async function updateInvitationStatus(id, status) {
  return store.withLock(async () => {
    const data = await store.read();
    const invitation = data.invitations[id];
    if (invitation) {
      invitation.status = status;
      invitation.updatedAt = new Date().toISOString();
      await store.write(data);
    }
    return invitation;
  });
}

module.exports = { createInvitation, getInvitationsForEmail, updateInvitationStatus };
