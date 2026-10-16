import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './Home';
import { langFromPath, type Lang } from './i18n/langs';
import tr from './i18n/tr';
import type { HomeCopy } from './i18n/types';
import './home.css';

/* Türkçe pakete gömülü; diğer diller yalnız o dilin sayfası açılınca yüklenir. */
const LOADERS: Record<Exclude<Lang, 'tr'>, () => Promise<{ default: HomeCopy }>> = {
  en: () => import('./i18n/en'),
  de: () => import('./i18n/de'),
  es: () => import('./i18n/es'),
  fr: () => import('./i18n/fr'),
  pt: () => import('./i18n/pt'),
  ru: () => import('./i18n/ru'),
  ja: () => import('./i18n/ja'),
  ko: () => import('./i18n/ko'),
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('AliKa uygulama kökü bulunamadı.');
}

const lang = langFromPath(window.location.pathname);

function render(copy: HomeCopy) {
  createRoot(root!).render(
    <StrictMode>
      <Home lang={lang} t={copy} />
    </StrictMode>,
  );
}

if (lang === 'tr') {
  render(tr);
} else {
  void LOADERS[lang]().then((module) => render(module.default));
}
