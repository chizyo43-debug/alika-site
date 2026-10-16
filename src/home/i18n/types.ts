/* Ana sayfanın dile bağlı bütün metinleri. Yapı (sıra, platform, görsel, video) Home.tsx'te kalır;
   burada yalnız okunan yazı vardır. Dil dosyaları yalnız `import type` kullanır ki derleme betiği
   (tools/build-language-homes.mjs) onları Node ile doğrudan okuyabilsin. */

export type ScreenId =
  | 'win-panel' | 'win-rules' | 'win-quiz' | 'win-protect' | 'win-homework'
  | 'and-panel' | 'and-reward' | 'and-quiz' | 'and-protect' | 'and-child';

export type AudienceId = 'kardes' | 'ilk-telefon' | 'sinav' | 'paylasimli';
export type ControlFeature = 'dailyTime' | 'appRules' | 'webFilter' | 'reports' | 'tamperProof';
export type LearningFeature = 'quiz' | 'content' | 'figures' | 'exam' | 'notes';
export type FamilyFeature = 'tasks' | 'network' | 'messages' | 'sharedPhone';
export type TvGame = 'rally' | 'station' | 'wheel' | 'nameCity';
export type VideoKey = 'winSetup' | 'androidSetup' | 'winQuiz';

export interface TitleBody {
  title: string;
  body: string;
}

export interface NameBody {
  name: string;
  body: string;
}

interface FeatureGroupCopy<K extends string> {
  title: string;
  lead: string;
  items: Record<K, NameBody>;
}

interface PlatformCopy {
  tags: string[];
  title: string;
  body: string;
}

export interface HomeCopy {
  /* Arama motoru ve JS'siz okuyucu için statik metin (derlemede HTML'e yazılır). */
  seo: {
    h1: string;
    pricing: string;
    schemaDescription: string;
    featureList: string[];
  };
  a11y: {
    skip: string;
    home: string;
    mainMenu: string;
    footerMenu: string;
    toLight: string;
    toDark: string;
    storeAria: string;
    playAria: string;
    scrollDown: string;
    language: string;
    tvGames: string;
    openScreen: (label: string, platform: string) => string;
    screenAlt: (label: string) => string;
  };
  nav: { features: string; videos: string; faq: string; privacy: string };
  store: { forWindows: string; forAndroid: string; getStore: string; getPlay: string };
  hero: {
    how: string;
    platforms: string;
    trust: string;
    contact: string;
    mascotAlt: string;
    tagline: [string, string];
    live: string;
  };
  screens: Record<ScreenId, { label: string; body: string }>;
  dialog: { watch: string; close: string; note?: string };
  intro: {
    eyebrow: string;
    /* Vurgu ortadaki parçadadır: [önce, vurgulu, sonra]. */
    lead: [string, string, string];
    watchVideos: string;
    stats: { value: string; label: string }[];
  };
  rail: { title: string; lead: string };
  platforms: {
    windows: PlatformCopy & { imageAlt: string };
    android: PlatformCopy & { imageAlt: string };
    tv: PlatformCopy & { ready: string; download: string; games: Record<TvGame, NameBody> };
  };
  audiences: {
    title: string;
    lead: string;
    items: Record<AudienceId, TitleBody & { points: string[] }>;
  };
  features: {
    title: string;
    lead: string;
    control: FeatureGroupCopy<ControlFeature>;
    learning: FeatureGroupCopy<LearningFeature>;
    family: FeatureGroupCopy<FamilyFeature>;
  };
  how: {
    title: string;
    lead: string;
    steps: TitleBody[];
    videos: string;
    channel: string;
    firstSetup: string;
    usage: string;
    /* Videolar Türkçe; diğer dillerde bunu söyleyen kısa not. */
    videoNote?: string;
  };
  videos: Record<VideoKey, TitleBody>;
  ages: { title: string; lead: string; unit: string; items: TitleBody[] };
  trust: { eyebrow: string; title: string; items: TitleBody[]; privacyLink: string };
  faq: { title: string; lead: string; items: { q: string; a: string }[] };
  contact: { eyebrow: string; title: string; lead: string; copy: string; copied: string };
  footer: {
    tagline: string;
    product: string;
    download: string;
    support: string;
    legal: string;
    platforms: string;
    audiences: string;
    features: string;
    how: string;
    faq: string;
    guides: string;
    content: string;
    channel: string;
    email: string;
    privacy: string;
    terms: string;
  };
}
