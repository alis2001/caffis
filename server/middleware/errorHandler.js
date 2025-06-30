// server/middleware/errorHandler.js

module.exports = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  if (res.headersSent) return next(err);

  const code = err.status || 500;
  const message = err.message || 'INTERNAL_SERVER_ERROR';

  res.status(code).json({ error: message });
};
