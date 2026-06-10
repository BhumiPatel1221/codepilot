const { createChatResponse } = require('../services/aiService');

async function chat(req, res) {
  const { prompt, messages, context } = req.body;
  try {
    const response = await createChatResponse({ prompt, messages, context });
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { chat };
