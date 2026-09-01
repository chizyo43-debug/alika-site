import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import knowledgeBase from '../src/knowledge-base.json' with { type: 'json' };

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('knowledge base is broad, uniquely keyed, and link constrained', () => {
  assert.ok(knowledgeBase.length >= 25, 'verified product coverage unexpectedly shrank');
  assert.equal(new Set(knowledgeBase.map((article) => article.id)).size, knowledgeBase.length);
  for (const article of knowledgeBase) {
    assert.ok(article.title.length >= 4, `${article.id}: title is missing`);
    assert.ok(article.content.length >= 80, `${article.id}: facts are too short`);
    assert.ok(article.keywords.length >= 3, `${article.id}: retrieval keywords are incomplete`);
    for (const link of article.links) {
      assert.match(link.href, /^(\/|https:\/\/apps\.microsoft\.com\/detail\/9N3P9F5ZKR5S|mailto:alika\.destek@gmail\.com)/);
    }
  }
});

test('high-risk product claims remain synchronized with public source copy', () => {
  const book = fs.readFileSync(path.join(siteRoot, 'src', 'book-experience.tsx'), 'utf8');
  const index = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
  const privacy = fs.readFileSync(path.join(siteRoot, 'legal', 'privacy.html'), 'utf8');
  const facts = knowledgeBase.map((article) => article.content).join('\n');

  assert.match(book, /Windows, Android ve Android TV temeli/);
  assert.match(book, /yalnız Windows sürümünü kapsar/);
  assert.match(index, /7 günlük deneme/);
  assert.match(facts, /yalnız Windows sürümünü kapsar/);
  assert.match(facts, /Yanlış cevap ceza değildir/);
  assert.match(facts, /gizli izleme/i);
  assert.match(privacy, /Optional website AI assistant/);
});
