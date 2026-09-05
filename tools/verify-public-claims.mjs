import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bookPath = path.join(root, 'src', 'book-experience.tsx');
const knowledgeBasePath = path.join(root, 'assistant-service', 'src', 'knowledge-base.json');
const productKnowledgePath = path.join(root, 'assistant-service', 'src', 'product-knowledge.json');

const book = fs.readFileSync(bookPath, 'utf8');
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

const combinedSources = [book, knowledgeBaseSource, productKnowledgeSource].join('\n');
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
  book,
  /id: 'windows'.*status: 'Bugün kullanılabilir'/,
  'Windows must remain marked as generally available',
);
requireMatch(
  book,
  /id: 'android-mobil'.*status: 'Geliştiriliyor'/,
  'Android mobile must remain marked as under development',
);
requireMatch(
  book,
  /id: 'android-tv'.*status: 'Geliştiriliyor'/,
  'Android TV must remain marked as under development',
);

const basePlatforms = requireArticle(knowledgeBase, 'platforms');
const baseAndroid = requireArticle(knowledgeBase, 'android');
const baseAndroidTv = requireArticle(knowledgeBase, 'android-tv');
const baseLearning = requireArticle(knowledgeBase, 'learning');
const baseRewardSafety = requireArticle(knowledgeBase, 'reward-safety');
const baseDailyFlow = requireArticle(knowledgeBase, 'daily-flow');

for (const article of [basePlatforms, baseAndroid, baseAndroidTv]) {
  if (article && !/henüz genel mağaza indirmesi değildir/i.test(article.content)) {
    errors.push(`${article.id} must state that Android/TV is not a general store download`);
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
if (availability && !/Android.*kapalı alfa/i.test(availability.content)) {
  errors.push('availability article must identify Android and TV as development/closed-alpha products');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Public product claims are consistent.');
}

