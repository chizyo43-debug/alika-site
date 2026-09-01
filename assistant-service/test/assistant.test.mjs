import test from 'node:test';
import assert from 'node:assert/strict';
import { parseModelResponse, retrieveKnowledge } from '../src/assistant.mjs';

test('retrieval prioritizes pricing facts', () => {
  const results = retrieveKnowledge('Fiyatı ne kadar, deneme var mı?', 4);
  assert.equal(results[0].id, 'pricing');
});

test('retrieval prioritizes privacy facts', () => {
  const results = retrieveKnowledge('Çocuğumun verileri buluta gidiyor mu?', 4);
  assert.equal(results[0].id, 'privacy');
});

test('model actions are restricted to retrieved AliKa links', () => {
  const articles = retrieveKnowledge('fiyat deneme', 3);
  const result = parseModelResponse(JSON.stringify({
    answer: 'Yedi günlük deneme vardır.',
    actions: [
      { label: 'İndir', href: '/downloads/' },
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
