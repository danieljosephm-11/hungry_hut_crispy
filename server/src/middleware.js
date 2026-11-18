import { ZodError } from 'zod';
import { httpError } from './lib/http.js';

export function notFound(req, _res, next) {
  next(httpError(404, `API route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message || 'Please check the highlighted fields.',
      errors: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'That image is too large (max 6 MB).' : 'Image upload failed.';
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value already exists. Try a different name or code.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Some fields are invalid.',
      errors: Object.values(err.errors).map((item) => ({ path: item.path, message: item.message })),
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid record identifier.' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error('[api error]', err);
  return res.status(status).json({
    message: status >= 500 ? 'Something went wrong in the kitchen. Please try again.' : err.message,
    ...(err.details ? { errors: err.details } : {}),
  });
}
