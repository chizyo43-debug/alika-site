import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import knowledgeBase from '../src/knowledge-base.json' with { type: 'json' };
import productKnowledge from '../src/product-knowledge.json' with { type: 'json' };
import productKnowledgeIndex from '../src/product-knowledge-index.json' with { type: 'json' };
import videoCatalog from '../src/video-guide-catalog.json' with { type: 'json' };
import knowledgeVerification from '../src/knowledge-verification.json' with { type: 'json' };
import { verifyKnowledgeSnapshot } from '../tools/knowledge-verification.mjs';

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

test('product manual is indexed, detailed, and public-safe', () => {
  assert.equal(productKnowledge.version, productKnowledgeIndex.sourceVersion);
  assert.ok(productKnowledge.articles.length >= 25, 'detailed manual coverage unexpectedly shrank');
  assert.equal(productKnowledgeIndex.entries.length, productKnowledge.articles.length);

  const articleIds = productKnowledge.articles.map((article) => article.id);
  const indexIds = productKnowledgeIndex.entries.map((entry) => entry.id);
  assert.deepEqual(new Set(indexIds), new Set(articleIds));
  assert.equal(new Set(articleIds).size, articleIds.length);

  const serialized = JSON.stringify(productKnowledge);
  assert.doesNotMatch(serialized, /C:\\\\Users|api[_ -]?key|recovery code value|private key/i);
  for (const article of productKnowledge.articles) {
    assert.ok(['all', 'windows', 'android', 'android-tv', 'cross-platform'].includes(article.platform), `${article.id}: invalid platform`);
    assert.ok(['available', 'testing', 'mixed'].includes(article.availability), `${article.id}: invalid availability`);
    assert.ok(article.menuPath.length >= 3, `${article.id}: menu path is missing`);
    assert.ok(article.content.length >= 120, `${article.id}: facts are too short`);
    assert.ok(article.steps.length >= 2, `${article.id}: steps are incomplete`);
    assert.ok(article.keywords.length >= 5, `${article.id}: retrieval keywords are incomplete`);
    for (const link of article.links) assert.match(link.href, /^\//);
  }
});

test('knowledge verification date and source hashes are current', () => {
  assert.equal(knowledgeVerification.verifiedAt, productKnowledge.version);
  assert.equal(knowledgeVerification.sourceVersions.productKnowledgeIndex, productKnowledgeIndex.sourceVersion);
  assert.deepEqual(verifyKnowledgeSnapshot(), []);
});

test('knowledge verification rejects a source changed after review', () => {
  const staleManifest = structuredClone(knowledgeVerification);
  staleManifest.sources['knowledge-base.json'] = '0'.repeat(64);
  assert.deepEqual(verifyKnowledgeSnapshot(staleManifest), [
    'knowledge-base.json changed after the recorded verification',
  ]);
});

test('both site and assistant deployments enforce knowledge freshness', () => {
  const pagesWorkflow = fs.readFileSync(path.join(siteRoot, '.github', 'workflows', 'pages.yml'), 'utf8');
  const cloudRunDeploy = fs.readFileSync(path.join(siteRoot, 'assistant-service', 'deploy.ps1'), 'utf8');
  assert.match(pagesWorkflow, /npm run knowledge:verify/);
  assert.match(cloudRunDeploy, /npm run knowledge:verify/);
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

test('assistant video URLs stay synchronized with the public nine-language guide catalog', () => {
  const source = fs.readFileSync(path.join(siteRoot, 'src', 'data', 'video-guides.ts'), 'utf8');
  const directArrays = new Set(['tr', 'en', 'es']);
  for (const [language, entry] of Object.entries(videoCatalog.languages)) {
    const marker = directArrays.has(language)
      ? `const ${language}Videos = [`
      : `const ${language}Videos = createLocalizedGuideVideos('${language}', [`;
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `${language}: source video block is missing`);
    const endMarker = directArrays.has(language) ? '] as const satisfies readonly GuideVideo[];' : ']);';
    const end = source.indexOf(endMarker, start);
    assert.notEqual(end, -1, `${language}: source video block is incomplete`);
    const sourceIds = [...source.slice(start, end).matchAll(/\bid:\s*'([A-Za-z0-9_-]{11})'/g)].map((match) => match[1]);
    const catalogVideos = Object.values(entry.videos);
    assert.equal(catalogVideos.length, 13, `${language}: assistant must expose 13 videos`);
    assert.deepEqual(catalogVideos.map((video) => video.id), sourceIds, `${language}: assistant video IDs drifted from the site catalog`);
    assert.equal(new Set(sourceIds).size, 13, `${language}: duplicate YouTube video ID`);
  }
});

test('site assistant visibly separates actions from verified dated evidence', () => {
  const widget = fs.readFileSync(path.join(siteRoot, 'public', 'site-assistant.js'), 'utf8');
  assert.match(widget, /Doğrulanmış kaynaklar/);
  assert.match(widget, /Son doğrulama/);
  assert.match(widget, /className = 'evidence'/);
  assert.match(widget, /renderSourceEvidence\(sourceLinks\)/);
});
