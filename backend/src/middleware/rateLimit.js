import { ApiError } from '../utils/http.js';

// This limiter is intentionally dependency-free. It bounds both repeated guesses
// for one account and username spraying from one address, while keeping memory
// bounded for long-lived instances. Vercel may run more than one instance, so the
// platform firewall remains the appropriate place for a stricter global policy.
export function loginRateLimit({
  windowMs = 15 * 60 * 1000,
  max = 10,
  maxPerIp = 50,
  maxEntries = 10_000,
  now = () => Date.now()
} = {}) {
  const failures = new Map();

  function activeEntry(key, timestamp) {
    const entry = failures.get(key);
    if (!entry || timestamp - entry.startedAt >= windowMs) {
      failures.delete(key);
      return null;
    }
    return entry;
  }

  function prune(timestamp) {
    if (failures.size < maxEntries) return;
    for (const [key, entry] of failures) {
      if (timestamp - entry.startedAt >= windowMs) failures.delete(key);
    }
    while (failures.size >= maxEntries) failures.delete(failures.keys().next().value);
  }

  return (request, response, next) => {
    const timestamp = now();
    const identifier = String(request.body?.identifier || request.body?.email || '').trim().toLowerCase();
    const ipKey = `ip:${request.ip}`;
    const accountKey = `account:${request.ip}|${identifier}`;
    const limits = [[ipKey, maxPerIp], [accountKey, max]];

    for (const [key, limit] of limits) {
      const entry = activeEntry(key, timestamp);
      if (entry?.count >= limit) {
        const retryAfter = Math.max(1, Math.ceil((windowMs - (timestamp - entry.startedAt)) / 1000));
        return next(new ApiError(
          429,
          'LOGIN_RATE_LIMITED',
          'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.',
          { retryAfter }
        ));
      }
    }

    response.once('finish', () => {
      const finishedAt = now();
      if (response.statusCode >= 200 && response.statusCode < 300) {
        failures.delete(accountKey);
        return;
      }
      if (response.statusCode !== 401) return;

      prune(finishedAt);
      for (const [key] of limits) {
        const entry = activeEntry(key, finishedAt);
        if (entry) entry.count += 1;
        else failures.set(key, { startedAt: finishedAt, count: 1 });
      }
    });

    return next();
  };
}
