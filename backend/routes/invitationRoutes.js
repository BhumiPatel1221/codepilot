const express = require('express');
const { createInvitation, getInvitationsForEmail, updateInvitationStatus } = require('../services/invitationService');
const { getUserByEmail } = require('../services/userService');
const { getWorkspace, saveWorkspace } = require('../services/workspaceService');

const router = express.Router();

// Fetch pending invitations for a user
router.get('/invitations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const invites = await getInvitationsForEmail(email);
    res.json(invites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Create an invitation
router.post('/invitations', async (req, res) => {
  try {
    const { workspaceId, inviterId, inviterEmail, inviteeEmail, role, workspaceName } = req.body;
    
    // Validate target user
    const targetUser = await getUserByEmail(inviteeEmail);
    if (!targetUser) {
      return res.status(404).json({ error: 'Invited email does not belong to a registered user.' });
    }

    const invitation = await createInvitation({
      workspaceId,
      inviterId,
      inviterEmail,
      inviteeEmail,
      role,
      workspaceName
    });

    res.json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// Accept or Reject invitation
router.post('/invitations/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId, userEmail } = req.body; // status = 'accepted' | 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { getInvitationsForEmail } = require('../services/invitationService');
    // We fetch pending invitations for userEmail and check if this id exists.
    // If it doesn't, it might have been already processed or deleted.
    const invites = await getInvitationsForEmail(userEmail);
    if (!invites.find(i => i.id === id)) {
      return res.status(400).json({ error: 'Invitation expired or already processed' });
    }

    const invitation = await updateInvitationStatus(id, status);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // If accepted, add user to workspace
    if (status === 'accepted') {
      const workspace = await getWorkspace(invitation.workspaceId);
      if (workspace) {
        if (!workspace.collaborators) workspace.collaborators = [];
        // Prevent duplicates
        if (!workspace.collaborators.find(c => c.id === userId)) {
          const newCollaborator = {
            id: userId,
            email: userEmail,
            role: invitation.role
          };
          workspace.collaborators.push(newCollaborator);
          await saveWorkspace(workspace);

          // Emit real-time event to workspace room
          const io = req.app.get('io');
          if (io) {
            io.to(workspace.id).emit('workspace:collaborator:added', {
              roomId: workspace.id,
              collaborator: newCollaborator
            });
          }
        }
      }
    }

    res.json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
});

module.exports = router;
