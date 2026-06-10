const ALLOWED_LANGUAGES = new Set(['python', 'javascript', 'typescript', 'java', 'cpp']);
const { env } = require('../config/env');

function validateRequired(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    return next();
  };
}

function validateExecuteRequest(req, res, next) {
  const { language, code } = req.body;

  if (!ALLOWED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: 'Unsupported language' });
  }
  if (typeof code !== 'string' || code.length === 0) {
    return res.status(400).json({ error: 'Code must be a non-empty string' });
  }
  if (code.length > env.EXECUTION_MAX_CODE_SIZE) {
    return res.status(413).json({ error: 'Code payload too large' });
  }
  return next();
}

module.exports = { validateRequired, validateExecuteRequest, ALLOWED_LANGUAGES };
