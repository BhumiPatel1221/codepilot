const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
// It uses the GEMINI_API_KEY environment variable.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function createChatResponse({ prompt, messages = [], context = null }) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format history
    const history = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      }));
      
    const chat = model.startChat({ history });
    
    let fullPrompt = prompt;
    if (context && context.content) {
      fullPrompt = `Context from file '${context.fileName}':\n\`\`\`\n${context.content}\n\`\`\`\n\nUser Question/Request:\n${prompt}`;
    }

    try {
      const result = await chat.sendMessage(fullPrompt);
      const text = result.response.text();

      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: text,
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      throw e;
    }
  } catch (error) {
    console.error('AI Service Error:', error);
    
    let userFriendlyMessage = `Error generating response: ${error.message}`;
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      userFriendlyMessage = "⏳ **Rate Limit Exceeded**\n\nThe free Gemini API tier limits how fast we can send messages. Please wait a few seconds and try again. (If this happens frequently, consider upgrading your API key quota).";
    }

    return {
      id: `ai-err-${Date.now()}`,
      role: 'assistant',
      content: userFriendlyMessage,
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { createChatResponse };
