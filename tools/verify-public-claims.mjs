import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homePath = path.join(root, 'src', 'home', 'Home.tsx');
const i18nDir = path.join(root, 'src', 'home', 'i18n');

const home = fs.readFileSync(homePath, 'utf8');
// Ana sayfa metinleri dil dosyalarında: Türkçe metin ölçüttür, tüm diller yasaklı iddialar için taranır.
const i18nSources = fs.readdirSync(i18nDir)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => fs.readFileSync(path.join(i18nDir, name), 'utf8'));
const trCopy = fs.readFileSync(path.join(i18nDir, 'tr.ts'), 'utf8');
const storeCampaign = fs.readFileSync(path.join(root, 'src', 'store-campaign.ts'), 'utf8');
// Rehber sayfalarının metni tools/build.py içinde.
const guideSource = fs.readFileSync(path.join(root, 'tools', 'build.py'), 'utf8');
const errors = [];

function requireMatch(source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

const combinedSources = [home, ...i18nSources, guideSource].join('\n');
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

// Fiyat mağazada gösterilir; sayfa metninde tutar yazılmaz (yalnız mağaza doğrulamalı ld+json).
if (/₺\s*\d|\d\s*(?:TL|TRY)\b|[¥₩€$£]\s*\d/.test([home, ...i18nSources].join('\n'))) {
  errors.push('visible home copy must not state a price; the stores show it');
}
// Deneme süreleri mağazalardakiyle aynı kalmalı: Play 14 gün, Microsoft Store 7 gün.
requireMatch(trCopy, /trialPlay: '14 gün ücretsiz/, 'Android trial must stay 14 days as on Google Play');
requireMatch(trCopy, /trialStore: '7 gün ücretsiz/, 'Windows trial must stay 7 days as on Microsoft Store');
// Hazır ders içeriği yalnız Türkiye ortaokul (5–8); diğer sınıflar ve ülkeler plan aşamasında.
requireMatch(trCopy, /Türkiye ortaokul \(5–8\. sınıf\)/, 'ready content scope must say Türkiye ortaokul (5–8. sınıf)');
requireMatch(trCopy, /status: 'plan', label: 'Plan aşamasında'/, 'other grades and countries must be shown as Plan aşamasında');
if (/United Kingdom|Vereinigte Königreich|Reino Unido|Royaume-Uni|Великобритани|イギリス|영국/.test(i18nSources.join(' '))) {
  errors.push('home copy must not claim content packs for other countries; only Türkiye 5–8 is published');
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
  storeCampaign,
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

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Public product claims are consistent.');
}

