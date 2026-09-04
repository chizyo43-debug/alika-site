import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, createRequestHandler } from '../src/http.mjs';

async function withServer(handler, callback) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('chat endpoint enforces origin and returns assistant response', async () => {
  let receivedPayload;
  const handler = createRequestHandler({
    assistant: { answer: async (payload) => {
      receivedPayload = payload;
      return { answer: `Yanıt: ${payload.message}`, actions: [], sources: [], followUp: '' };
    } },
    allowedOrigins: ['https://www.alika.tr'],
    rateSalt: 'test',
  });
  await withServer(handler, async (baseUrl) => {
    const forbidden = await fetch(`${baseUrl}/v1/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: JSON.stringify({ message: 'Merhaba' }),
    });
    assert.equal(forbidden.status, 403);

    const response = await fetch(`${baseUrl}/v1/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://www.alika.tr' }, body: JSON.stringify({ message: 'AliKa nedir?', language: 'tr', journey: 'fit' }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://www.alika.tr');
    assert.equal((await response.json()).answer, 'Yanıt: AliKa nedir?');
    assert.equal(receivedPayload.journey, 'fit');
  });
});

test('chat endpoint validates message length', async () => {
  const handler = createRequestHandler({
    assistant: { answer: async () => assert.fail('assistant should not be called') },
    allowedOrigins: ['https://www.alika.tr'],
  });
  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://www.alika.tr' }, body: JSON.stringify({ message: 'x'.repeat(801) }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'invalid_message');
  });
});

test('chat endpoint accepts the feedback journey', async () => {
  let receivedJourney;
  const handler = createRequestHandler({
    assistant: { answer: async (payload) => {
      receivedJourney = payload.journey;
      return { answer: 'Devam edelim.', actions: [], sources: [], followUp: '', emailDraft: null };
    } },
    allowedOrigins: ['https://www.alika.tr'],
  });
  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://www.alika.tr' },
      body: JSON.stringify({ message: 'Bir sorun bildirmek istiyorum.', journey: 'feedback' }),
    });
    assert.equal(response.status, 200);
    assert.equal(receivedJourney, 'feedback');
  });
});

test('rate limiter blocks requests over the short window', () => {
  const limiter = createRateLimiter({ shortLimit: 2, dailyLimit: 10, now: () => 1000 });
  assert.equal(limiter.check('visitor'), true);
  assert.equal(limiter.check('visitor'), true);
  assert.equal(limiter.check('visitor'), false);
});
