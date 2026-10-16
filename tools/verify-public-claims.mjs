import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, 'src', 'home', 'Home.tsx');
const i18nDir = path.join(root, 'src', 'home', 'i18n');
const knowledgeBasePath = path.join(root, 'assistant-service', 'src', 'knowledge-base.json');
const productKnowledgePath = path.join(root, 'assistant-service', 'src', 'product-knowledge.json');

const home = fs.readFileSync(homePath, 'utf8');
// Ana sayfa metinleri dil dosyalarında: Türkçe metin ölçüttür, tüm diller yasaklı iddialar için taranır.
const i18nSources = fs.readdirSync(i18nDir)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => fs.readFileSync(path.join(i18nDir, name), 'utf8'));
const trCopy = fs.readFileSync(path.join(i18nDir, 'tr.ts'), 'utf8');
const langs = fs.readFileSync(path.join(i18nDir, 'langs.ts'), 'utf8');
const knowledgeBaseSource = fs.readFileSync(knowledgeBasePath, 'utf8');
const productKnowledgeSource = fs.readFileSync(productKnowledgePath, 'utf8');
const knowledgeBase = JSON.parse(knowledgeBaseSource);
const productKnowledge = JSON.parse(productKnowledgeSource);
const errors = [];

function requireMatch(source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

function requireArticle(collection, id) {
  const article = collection.find((candidate) => candidate.id === id);
  if (!article) errors.push(`missing required public-claim article: ${id}`);
  return article;
}

const combinedSources = [home, ...i18nSources, knowledgeBaseSource, productKnowledgeSource].join('\n');
const bannedClaims = [
  [/3\s*soru\s*=\s*\+?\s*15\s*dakika/i, 'fixed 3-question/15-minute claim is forbidden'],
  [/3\s*soru\s*=\s*(?:en\s*fazla\s*)?3\s*dakika/i, 'fixed 3-question/3-minute claim cannot be a public site promise'],
  [/doğru cevap başına (?:kazanılacak )?dakika/i, 'reward must use correct-answers-per-minute, not minutes-per-answer'],
  [/doğru cevapların kaç dakika kazandıracağını/i, 'reward copy uses the obsolete minutes-per-answer model'],
  [/Windows, Android ve Android TV temeli bugün kullanılabilir/i, 'only Windows is generally available today'],
];

for (const [pattern, message] of bannedClaims) {
  if (pattern.test(combinedSources)) errors.push(message);
}

requireMatch(
  home,
  /id: 'windows', tone: 'p-windows', status: 'ready', tags: windows\.tags/,
  'Windows must remain marked as generally available',
);
requireMatch(
  trCopy,
  /windows: \{\s*tags: \['Bugün kullanılabilir'/,
  'Windows must remain labelled as available today',
);
requireMatch(
  home,
  /id: 'android', tone: 'p-android', status: 'ready', tags: android\.tags/,
  'Android phone/tablet must be marked as available',
);
requireMatch(
  trCopy,
  /android: \{\s*tags: \['Bugün kullanılabilir'.*'Google Play'\]/,
  'Android phone/tablet must be labelled as available on Google Play',
);
requireMatch(
  langs,
  /play\.google\.com\/store\/apps\/details\?id=com\.alika\.parental/,
  'Android must link to its Google Play listing',
);
requireMatch(
  home,
  /id: 'tv', tone: 'p-tv', status: 'dev', tags: tv\.tags/,
  'Android TV must remain marked as under development',
);
requireMatch(
  trCopy,
  /tv: \{\s*tags: \['Geliştiriliyor'/,
  'Android TV must remain labelled as under development',
);

const basePlatforms = requireArticle(knowledgeBase, 'platforms');
const baseAndroid = requireArticle(knowledgeBase, 'android');
const baseAndroidTv = requireArticle(knowledgeBase, 'android-tv');
const baseLearning = requireArticle(knowledgeBase, 'learning');
const baseRewardSafety = requireArticle(knowledgeBase, 'reward-safety');
const baseDailyFlow = requireArticle(knowledgeBase, 'daily-flow');

for (const article of [basePlatforms, baseAndroid]) {
  if (article && !/Android.*Google Play/i.test(article.content)) {
    errors.push(`${article.id} must state that Android is available on Google Play`);
  }
}
for (const article of [basePlatforms, baseAndroidTv]) {
  if (article && !/Android TV.*henüz genel mağaza indirmesi değildir/i.test(article.content)) {
    errors.push(`${article.id} must state that Android TV is not a general store download`);
  }
}
for (const article of [basePlatforms, baseAndroid, baseAndroidTv]) {
  if (article && /kapalı alfa/i.test(article.content)) {
    errors.push(`${article.id} must not describe the published Android app as closed alpha`);
  }
}

for (const article of [baseLearning, baseRewardSafety]) {
  if (article && !/bir dakika.*gereken doğru cevap sayıs/i.test(article.content)) {
    errors.push(`${article.id} must describe the configurable correct-answers-per-minute model`);
  }
}

if (baseDailyFlow && !/doğru cevap sayısına ulaşıldığında bir dakika eklenir/i.test(baseDailyFlow.content)) {
  errors.push('daily-flow must award one minute only after the configured correct-answer threshold');
}

const productArticles = productKnowledge.articles ?? [];
const windowsQuiz = requireArticle(productArticles, 'manual-windows-learning-quiz');
const androidQuiz = requireArticle(productArticles, 'manual-android-quiz-content');
const availability = requireArticle(productArticles, 'manual-availability-purchase');

for (const article of [windowsQuiz, androidQuiz]) {
  if (article && !/bir dakika.*gereken doğru cevap sayıs/i.test(article.content)) {
    errors.push(`${article.id} must describe the configurable correct-answers-per-minute model`);
  }
}

if (availability && !/Windows sürümü Microsoft Store'da genel kullanıma açıktır/i.test(availability.content)) {
  errors.push('availability article must identify Windows as the generally available Store product');
}
if (availability && !/Android telefon\/tablet sürümü Google Play'de/i.test(availability.content)) {
  errors.push('availability article must identify Android phone/tablet as available on Google Play');
}
if (availability && !/Android TV.*henüz genel mağaza indirmesi değildir/i.test(availability.content)) {
  errors.push('availability article must identify Android TV as not yet a general store download');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Public product claims are consistent.');
}

