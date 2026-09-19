import { ApiError } from '../utils/http.js';
import { isDatabaseUnavailable } from '../utils/databaseErrors.js';

export function notFound(request, _response, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `Endpoint ${request.method} ${request.originalUrl} tidak ditemukan.`));
}

export function errorHandler(error, _request, response, _next) {
  if (error.code === 'LOGIN_RATE_LIMITED') response.set('Retry-After', String(error.details?.retryAfter || 900));
  if (!(error instanceof ApiError) && isDatabaseUnavailable(error)) {
    response.set('Retry-After', '5');
    error = new ApiError(503, 'DATABASE_UNAVAILABLE', 'Koneksi database sementara tidak tersedia. Tunggu beberapa saat lalu coba kembali.');
  }
  const status = error instanceof ApiError ? error.status : 500;
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof ApiError ? error.message : 'Terjadi kesalahan pada server.';

  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  response.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details ? { details: error.details } : {})
    }
  });
}
