import catalog from './video-guide-catalog.json' with { type: 'json' };

const VIDEO_KEYS_BY_ARTICLE = {
  overview: ['windows-overview'],
  platforms: ['windows-overview'],
  windows: ['windows-overview', 'windows-panel', 'windows-child-rules'],
  learning: ['windows-child-question', 'windows-child-learning'],
  planning: ['windows-child-rules', 'windows-task-homework-exam'],
  reports: ['windows-reports'],
  privacy: ['windows-privacy'],
  'family-network': ['windows-devices-family'],
  content: ['windows-learning-content', 'windows-child-learning'],
  'installation-support': ['windows-installation'],
  'reward-safety': ['windows-child-question'],
  'daily-flow': ['windows-panel', 'windows-overview'],
  'content-import-formats': ['windows-learning-content'],
  'installation-security': ['windows-installation'],
  'windows-rules-detail': ['windows-child-rules'],
  'wellbeing-settings': ['windows-settings', 'windows-auxiliary'],
  'data-storage-deletion': ['windows-privacy'],
  'legal-use': ['windows-privacy'],
};

const VIDEO_KEYWORDS = {
  'windows-overview': ['genel bakis', 'nedir', 'ne ise yarar', 'overview', 'introduction'],
  'windows-installation': ['kur', 'kurulum', 'yukle', 'ilk ayar', 'pin', 'riza', 'kurtarma kodu', 'guvenli mod', 'install', 'setup', 'consent', 'recovery'],
  'windows-panel': ['panel', 'ana ekran', 'gunluk ozet', 'kalan sure', 'cihaz sagligi', 'dashboard', 'daily summary', 'remaining time'],
  'windows-child-rules': ['cocuk profili', 'kural', 'uygulama limiti', 'uygulama sure limiti', 'sure siniri', 'youtube', 'site limiti', 'uyku', 'haftalik plan', 'web koruma', 'sinav ayari', 'child rules', 'app limit', 'time limit', 'bedtime', 'weekly plan'],
  'windows-learning-content': ['icerik ekle', 'soru bankasi ekle', 'xlsx', 'csv', 'zip', 'alika paketi', 'chatgpt', 'add lessons', 'question bank', 'import'],
  'windows-child-learning': ['cocuk ogrenme', 'calisma ekrani', 'konu anlatimi', 'ilerleme', 'child learning', 'study', 'lesson', 'progress'],
  'windows-child-question': ['soru coz', 'dogru cevap', 'yanlis cevap', 'sure kazan', 'cozum kagidi', 'question', 'answer', 'earned time', 'explanation'],
  'windows-task-homework-exam': ['gorev olustur', 'odev olustur', 'sinav olustur', 'gorev', 'odev', 'sinav', 'task', 'homework', 'exam', 'assignment'],
  'windows-devices-family': ['aile agi', 'cihaz eslestir', 'qr', 'aile cihazi', 'mesaj', 'family network', 'pair device', 'devices'],
  'windows-reports': ['rapor', 'karne', 'sonuc', 'gecmis', 'olay', 'bildirim', 'report', 'results', 'history', 'notifications'],
  'windows-privacy': ['gizlilik', 'yerel veri', 'veri sil', 'bulut', 'privacy', 'local data', 'delete data', 'consent'],
  'windows-settings': ['ayar', 'profil', 'yas onerisi', 'goz molasi', 'yumusak inis', 'yedek', 'koruma motoru', 'settings', 'profile', 'wellbeing', 'backup'],
  'windows-auxiliary': ['sistem tepsisi', 'kisa panel', 'kilit ekrani', 'kilit nedeni', 'system tray', 'quick panel', 'lock screen'],
};

const VIDEO_CTA = {
  tr: '▶ İlgili Windows videosunu aç',
  en: '▶ Open the relevant Windows video',
  de: '▶ Passendes Windows-Video öffnen',
  es: '▶ Abrir el vídeo de Windows correspondiente',
  fr: '▶ Ouvrir la vidéo Windows correspondante',
  pt: '▶ Abrir o vídeo do Windows correspondente',
  ru: '▶ Открыть подходящее видео для Windows',
  ja: '▶ 関連するWindows動画を開く',
  ko: '▶ 관련 Windows 동영상 열기',
};

const VIDEO_STOP_TOKENS = new Set([
  'alika', 'site', 'sitesini', 'website', 'sayfa', 'page', 'guide', 'rehber',
]);

function fold(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(fold(value).split(/\s+/).filter((token) => token.length > 1 && !VIDEO_STOP_TOKENS.has(token)));
}

function cjkBigrams(value) {
  const characters = [...fold(value).replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, '')];
  const pairs = new Set();
  for (let index = 0; index < characters.length - 1; index += 1) {
    pairs.add(`${characters[index]}${characters[index + 1]}`);
  }
  return pairs;
}

function hasAnyPhrase(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

export function videoUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function retrieveVideoGuide(message, history = [], language = 'tr', articles = []) {
  const languageCatalog = catalog.languages[language] || catalog.languages.tr;
  const recentUserText = history
    .filter((item) => item?.role !== 'assistant' && typeof item?.text === 'string')
    .slice(-2)
    .map((item) => item.text)
    .join(' ');
  const query = fold(`${message} ${recentUserText}`);
  const current = fold(message);
  const mentionsWindows = hasAnyPhrase(current, ['windows', 'bilgisayar', 'pc']);
  const mentionsOtherPlatform = hasAnyPhrase(query, [
    'android', 'telefon', 'tablet', 'mobile', 'mobil', 'smartphone', 'handy', 'teléfono',
    'téléphone', 'telefone', 'телефон', 'телевизор', 'スマホ', 'スマートフォン', '안드로이드', '휴대폰',
    'android tv', 'televizyon',
  ]);
  if (mentionsOtherPlatform && !mentionsWindows) return null;

  const asksForVideo = hasAnyPhrase(query, ['video', 'izle', 'oynat', 'watch', 'play', 'vídeo', 'vidéo', 'видео', '動画', '동영상']);
  const nonOperational = hasAnyPhrase(current, [
    'kavga', 'catisma', 'tartisma', 'anlasmazlik', 'karsi cik', 'istemiyor', 'uygun mu', 'fiyat', 'ucret',
  ]);
  if (nonOperational && !asksForVideo) return null;

  const candidateKeys = [];
  for (const article of articles.slice(0, 3)) {
    for (const key of VIDEO_KEYS_BY_ARTICLE[article.id] || []) {
      if (!candidateKeys.includes(key)) candidateKeys.push(key);
    }
  }
  for (const key of Object.keys(languageCatalog.videos)) {
    if (!candidateKeys.includes(key)) candidateKeys.push(key);
  }

  const queryTokens = tokenSet(query);
  const queryCjkBigrams = cjkBigrams(query);
  const ranked = candidateKeys.map((key) => {
    const video = languageCatalog.videos[key];
    if (!video) return { key, video: null, score: 0 };
    const titleTokens = tokenSet(video.title);
    const descriptionTokens = tokenSet(video.description);
    const keywords = VIDEO_KEYWORDS[key] || [];
    const keywordTokens = tokenSet(keywords.join(' '));
    const titleCjkBigrams = cjkBigrams(video.title);
    const descriptionCjkBigrams = cjkBigrams(video.description);
    let score = 0;
    for (const token of queryTokens) {
      if (titleTokens.has(token)) score += 6;
      if (keywordTokens.has(token)) score += 5;
      if (descriptionTokens.has(token)) score += 2;
    }
    for (const pair of queryCjkBigrams) {
      if (titleCjkBigrams.has(pair)) score += 2;
      if (descriptionCjkBigrams.has(pair)) score += 1;
    }
    for (const keyword of keywords) {
      const normalized = fold(keyword);
      if (normalized.length > 2 && query.includes(normalized)) score += 10;
    }
    return { key, video, score };
  }).sort((left, right) => right.score - left.score || candidateKeys.indexOf(left.key) - candidateKeys.indexOf(right.key));

  const best = ranked[0];
  if (!best?.video || best.score < 7) return null;
  return {
    key: best.key,
    id: best.video.id,
    title: best.video.title,
    description: best.video.description,
    href: videoUrl(best.video.id),
    label: VIDEO_CTA[language] || VIDEO_CTA.tr,
    platform: 'Windows',
  };
}

export function getVideoCatalog() {
  return catalog;
}
