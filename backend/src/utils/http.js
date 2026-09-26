export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendData(response, data, status = 200, meta) {
  return response.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {})
  });
}
