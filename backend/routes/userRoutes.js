const express = require('express');
const { syncUser } = require('../services/userService');

const router = express.Router();

router.post('/users/sync', async (req, res) => {
  try {
    const { id, email, full_name, avatar_url } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required fields: id and email' });
    }
    const user = await syncUser({ id, email, full_name, avatar_url });
    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

module.exports = router;
