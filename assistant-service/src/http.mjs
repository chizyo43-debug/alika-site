import { createHash } from 'node:crypto';

const MAX_BODY_BYTES = 32_768;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_JOURNEYS = new Set(['general', 'fit', 'plan', 'tour', 'feedback']);

function json(res, status, body, origin = '') {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('invalid_json');
  }
}

function cleanPath(value) {
  if (typeof value !== 'string') return '/';
  const path = value.split(/[?#]/, 1)[0];
  return /^\/[a-z0-9/_-]{0,180}$/i.test(path) ? path : '/';
}

function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_request');
  if (body.website) throw new Error('invalid_request');
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length < 2 || message.length > 800) throw new Error('invalid_message');
  const language = typeof body.language === 'string' ? body.language.slice(0, 2).toLowerCase() : 'tr';
  const journey = typeof body.journey === 'string' && SUPPORTED_JOURNEYS.has(body.journey) ? body.journey : 'general';
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const safeHistory = history.map((item) => {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') {
      throw new Error('invalid_history');
    }
    return { role: item.role, text: item.text.trim().slice(0, 800) };
  }).filter((item) => item.text);
  return { message, language, journey, history: safeHistory, pagePath: cleanPath(body.pagePath) };
}

function requestKey(req, secret) {
  const source = `${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'}|${req.headers['user-agent'] || ''}`;
  return createHash('sha256').update(`${secret}|${source}`).digest('hex');
}

export function createRateLimiter({ shortLimit = 12, dailyLimit = 60, now = () => Date.now() } = {}) {
  const records = new Map();
  return {
    check(key) {
      const current = now();
      const record = records.get(key) || { shortStart: current, shortCount: 0, dayStart: current, dayCount: 0 };
      if (current - record.shortStart >= TEN_MINUTES_MS) {
        record.shortStart = current;
        record.shortCount = 0;
      }
      if (current - record.dayStart >= ONE_DAY_MS) {
        record.dayStart = current;
        record.dayCount = 0;
      }
      record.shortCount += 1;
      record.dayCount += 1;
      records.set(key, record);
      if (records.size > 10_000) {
        for (const [candidate, value] of records) {
          if (current - value.dayStart >= ONE_DAY_MS) records.delete(candidate);
          if (records.size <= 8_000) break;
        }
      }
      return record.shortCount <= shortLimit && record.dayCount <= dailyLimit;
    },
  };
}

export function createRequestHandler({ assistant, allowedOrigins, rateLimiter = createRateLimiter(), rateSalt = 'alika-local' }) {
  const origins = new Set(allowedOrigins);
  return async function handle(req, res) {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
    const allowedOrigin = origins.has(origin) ? origin : '';

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      return json(res, 200, { ok: true });
    }
    if (req.method === 'OPTIONS' && requestUrl.pathname === '/v1/chat') {
      if (!allowedOrigin) return json(res, 403, { error: 'origin_not_allowed' });
      res.writeHead(204, {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
      });
      return res.end();
    }
    if (req.method !== 'POST' || requestUrl.pathname !== '/v1/chat') {
      return json(res, 404, { error: 'not_found' });
    }
    if (!allowedOrigin) return json(res, 403, { error: 'origin_not_allowed' });
    if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return json(res, 415, { error: 'json_required' }, allowedOrigin);
    }
    if (!rateLimiter.check(requestKey(req, rateSalt))) {
      return json(res, 429, { error: 'rate_limited' }, allowedOrigin);
    }

    try {
      const payload = validatePayload(await readJson(req));
      const result = await assistant.answer(payload);
      return json(res, 200, result, allowedOrigin);
    } catch (error) {
      const publicErrors = new Set(['body_too_large', 'invalid_json', 'invalid_request', 'invalid_message', 'invalid_history']);
      const code = error instanceof Error ? error.message : 'assistant_unavailable';
      if (publicErrors.has(code)) return json(res, 400, { error: code }, allowedOrigin);
      console.error(JSON.stringify({ severity: 'ERROR', message: 'assistant_request_failed', code }));
      return json(res, 503, { error: 'assistant_unavailable' }, allowedOrigin);
    }
  };
}
