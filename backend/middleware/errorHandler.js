function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
}

module.exports = { notFoundHandler, errorHandler };
