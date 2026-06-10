const { v4: uuidv4 } = require('uuid');

const { executeInQueue } = require('../execution/executionService');

async function executeCode(req, res, next) {
  try {
    const executionId = `exec-${uuidv4()}`;
    const { language, code, stdin = '', roomId, files, activeFilePath } = req.body;
    const io = req.app.get('io');

    const result = await executeInQueue({
      language,
      code,
      files,
      activeFilePath,
      stdin,
      onOutput: (chunk) => {
        if (roomId) io.to(roomId).emit('terminal:output', { executionId, ...chunk });
        io.to(`execution:${executionId}`).emit('terminal:output', { executionId, ...chunk });
      }
    });

    return res.status(200).json({
      executionId,
      language,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { executeCode };
