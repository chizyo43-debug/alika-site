import http from 'node:http';
import { createAssistantClient } from './assistant.mjs';
import { createRequestHandler } from './http.mjs';

const allowedOrigins = (process.env.ALIKA_ALLOWED_ORIGINS || 'https://www.alika.tr,https://alika.tr,http://localhost:4173,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const handler = createRequestHandler({
  assistant: createAssistantClient(),
  allowedOrigins,
  rateSalt: process.env.ALIKA_RATE_SALT || 'alika-site-assistant',
});
const port = Number(process.env.PORT || 8080);
const server = http.createServer(handler);
server.requestTimeout = 30_000;
server.headersTimeout = 10_000;
server.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ severity: 'INFO', message: 'alika_site_assistant_ready', port }));
});
