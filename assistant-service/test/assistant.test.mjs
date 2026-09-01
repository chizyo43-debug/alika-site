import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssistantClient,
  parseModelResponse,
  retrieveConversationKnowledge,
  retrieveKnowledge,
} from '../src/assistant.mjs';

test('retrieval prioritizes pricing facts', () => {
  const results = retrieveKnowledge('Fiyatı ne kadar, deneme var mı?', 4);
  assert.equal(results[0].id, 'pricing');
});

test('retrieval prioritizes privacy facts', () => {
  const results = retrieveKnowledge('Çocuğumun verileri buluta gidiyor mu?', 4);
  assert.equal(results[0].id, 'privacy');
});

test('retrieval does not pad a specific answer with generic marketing facts', () => {
  const results = retrieveKnowledge('İnternet kesilirse AliKa çevrimdışı çalışır mı?', 5);
  assert.equal(results[0].id, 'privacy');
  assert.equal(results.some((item) => item.id === 'marketing-fit'), false);
  assert.equal(results.some((item) => item.id === 'installation-support'), false);
});

test('retrieval uses recent user context for a short follow-up', () => {
  const results = retrieveConversationKnowledge('Peki bunu nasıl ayarlarım?', [
    { role: 'user', text: 'Android telefonda uygulama süre sınırı koyabilir miyim?' },
    { role: 'assistant', text: 'Evet, ebeveyn rolünden yönetebilirsiniz.' },
  ], 5);
  assert.equal(results[0].id, 'android');
  assert.equal(results.some((item) => item.id === 'android'), true);
  assert.equal(results.some((item) => item.id === 'overview'), false);
});

test('family resistance questions use the specific coaching facts', () => {
  const results = retrieveKnowledge('Çocuğum karşı çıkıyor, kavga etmeden nasıl anlatırım?', 4);
  assert.equal(results[0].id, 'family-coaching');
});

test('model actions are restricted to retrieved AliKa links', () => {
  const articles = retrieveKnowledge('fiyat deneme', 3);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Yedi günlük deneme vardır.',
    actions: [
      { label: 'İndir', href: '/downloads/' },
      { label: 'Aynı adres', href: '/downloads/' },
      { label: 'Kötü bağlantı', href: 'https://example.com/phishing' },
    ],
    followUp: '',
  }), articles, 'tr');
  assert.deepEqual(result.actions, [{ label: 'İndir', href: '/downloads/' }]);
  assert.ok(result.sources.length > 0);
});

test('localized internal links retain the selected language', () => {
  const articles = retrieveKnowledge('installation support', 3);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Open the guides.',
    actions: [{ label: 'Guides', href: '/en/how-it-works/' }],
    followUp: '',
  }), articles, 'en');
  assert.deepEqual(result.actions, [{ label: 'Guides', href: '/en/how-it-works/' }]);
});

test('assistant uses the reasoning model and anti-template conversation rules', async () => {
  let request;
  const fakeClient = {
    models: {
      async generateContent(value) {
        request = value;
        return { text: JSON.stringify({ answer: 'Net yanıt.', actions: [], followUp: '' }) };
      },
    },
  };
  const assistant = createAssistantClient({}, { client: fakeClient });

  await assistant.answer({ message: 'AliKa nedir?', language: 'tr' });

  assert.equal(request.model, 'gemini-3.5-flash');
  assert.equal(request.config.temperature, 1);
  assert.equal(request.config.maxOutputTokens, 1800);
  assert.equal(request.config.thinkingConfig.thinkingLevel, 'LOW');
  assert.match(request.config.systemInstruction, /evidence, not as a script/);
  assert.match(request.config.systemInstruction, /followUp to an empty string by default/);
  assert.match(request.config.systemInstruction, /Never use stock praise/);
  assert.match(request.config.systemInstruction, /Do not invent screen names/);
  assert.match(request.config.systemInstruction, /Do not mention an account login/);
  assert.match(request.config.systemInstruction, /Never imply that AliKa replaces parental communication/);
});
