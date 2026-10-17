export const LANGS = ['tr', 'en', 'de', 'es', 'fr', 'pt', 'ru', 'ja', 'ko'] as const;
export type Lang = (typeof LANGS)[number];

/* Dil seçicide her dil kendi adıyla görünür. */
export const LANG_NAMES: Record<Lang, string> = {
  tr: 'Türkçe', en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français',
  pt: 'Português', ru: 'Русский', ja: '日本語', ko: '한국어',
};

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/* Türkçe kökte, diğer diller /{dil}/ altında. */
export function homePath(lang: Lang): string {
  return lang === 'tr' ? '/' : `/${lang}/`;
}

export function langFromPath(pathname: string): Lang {
  const first = pathname.split('/')[1] ?? '';
  return isLang(first) ? first : 'tr';
}

/* Hazır içerik kataloğu: uygulama Türkçe için /icerik/ adresini açar. */
export function contentPath(lang: Lang): string {
  return lang === 'tr' ? '/icerik/' : `/${lang}/content/`;
}

/* Yasal metinler: Türkçe sayfa Türkçe sürümü, diğer diller İngilizce sürümü açar. */
export function legalPath(lang: Lang, kind: 'privacy' | 'terms'): string {
  if (lang === 'tr') return kind === 'privacy' ? '/gizlilik/' : '/kullanim-kosullari/';
  return kind === 'privacy' ? '/privacy/' : '/eula/';
}

/* Yalnız gerçekten var olan rehberler. */
export const GUIDE_PATHS: Partial<Record<Lang, string>> = {
  tr: '/rehber/',
  en: '/en/guides/windows-child-screen-time/',
};
