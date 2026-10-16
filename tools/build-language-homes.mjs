// Vite'ın ürettiği dist/index.html kabuğundan her dil için ana sayfa kabuğu üretir.
// React aynı paketi kullanır; dil, adresin ilk parçasından seçilir. Burada yalnız arama
// motorlarının ve JavaScript çalışmadan açılan sayfanın gördüğü başlık, açıklama,
// yapılandırılmış veri ve kısa metin o dile çevrilir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homePath, LANGS, playStoreUrl } from '../src/home/i18n/langs.ts';
import { microsoftStoreUrl } from '../src/store-campaign.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const BASE_URL = 'https://www.alika.tr';
const locales = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'locales.json'), 'utf8'));
const OG_LOCALES = {
  tr: 'tr_TR', en: 'en_US', de: 'de_DE', es: 'es_ES', fr: 'fr_FR', pt: 'pt_BR', ru: 'ru_RU', ja: 'ja_JP', ko: 'ko_KR',
};
// Microsoft Store fiyatı yalnız doğrulanmış pazarlar için yazılır.
const STORE_OFFERS = {
  tr: { price: '80.00', currency: 'TRY' },
  ja: { price: '230', currency: 'JPY' },
  ko: { price: '2500', currency: 'KRW' },
};

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`)) ?? [];
  if (matches.length !== 1) throw new Error(`${label}: expected one match, found ${matches.length}`);
  return html.replace(pattern, () => replacement);
}

function setMeta(html, attr, name, value) {
  const pattern = new RegExp(`<meta ${attr}="${name.replace(/[.:]/g, '\\$&')}" content="[^"]*"\\s*/?>`);
  return replaceOnce(html, pattern, `<meta ${attr}="${name}" content="${esc(value)}" />`, `${attr}=${name}`);
}

function schema(lang, copy, canonical, storeUrl) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AliKa Parental Control',
    description: copy.seo.schemaDescription,
    inLanguage: lang,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Parental control',
    operatingSystem: 'Windows 10, Windows 11, Android',
    url: canonical,
    downloadUrl: storeUrl,
    publisher: { '@type': 'Organization', name: 'ErenKa Software' },
    featureList: copy.seo.featureList,
  };
  const offer = STORE_OFFERS[lang];
  if (offer) {
    data.offers = {
      '@type': 'Offer',
      price: offer.price,
      priceCurrency: offer.currency,
      availability: 'https://schema.org/InStock',
      url: storeUrl,
    };
  }
  // </script> kaçışı: JSON içinde "<" geçerse etiketi kapatmasın.
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
}

function fallback(copy, storeUrl, playUrl) {
  return `<section class="seoFallback">
        <h1>${esc(copy.seo.h1)}</h1>
        <p>${esc(copy.intro.lead.join(''))}</p>
        <p>${esc(copy.seo.pricing)}</p>
        <a href="${esc(storeUrl)}">Microsoft Store</a>
        <a href="${esc(playUrl)}">Google Play</a>
      </section>`;
}

function languageChunks() {
  const manifestPath = path.join(dist, '.vite', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return {};
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const chunks = {};
  for (const lang of LANGS) {
    const entry = manifest[`src/home/i18n/${lang}.ts`];
    if (entry?.file && lang !== 'tr') chunks[lang] = `/${entry.file}`;
  }
  return chunks;
}

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const chunks = languageChunks();

for (const lang of LANGS) {
  const { default: copy } = await import(`../src/home/i18n/${lang}.ts`);
  const seo = locales[lang];
  if (!seo) throw new Error(`${lang}: locales.json entry is missing`);
  const canonical = `${BASE_URL}${homePath(lang)}`;
  const storeUrl = microsoftStoreUrl(lang, '');
  const playUrl = playStoreUrl(lang);

  let html = template;
  html = replaceOnce(html, /<html lang="[^"]*">/, `<html lang="${lang}">`, 'html lang');
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(seo.seo_title)}</title>`, 'title');
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`, 'canonical');
  html = setMeta(html, 'name', 'description', seo.seo_description);
  html = setMeta(html, 'property', 'og:locale', OG_LOCALES[lang]);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:title', seo.seo_title);
  html = setMeta(html, 'property', 'og:description', seo.seo_description);
  html = setMeta(html, 'name', 'twitter:title', seo.seo_title);
  html = setMeta(html, 'name', 'twitter:description', seo.seo_description);
  html = replaceOnce(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, schema(lang, copy, canonical, storeUrl), 'ld+json');
  html = replaceOnce(html, /<section class="seoFallback">[\s\S]*?<\/section>/, fallback(copy, storeUrl, playUrl), 'seo fallback');
  if (chunks[lang]) {
    html = replaceOnce(html, /<\/head>/, `  <link rel="modulepreload" crossorigin href="${chunks[lang]}" />\n  </head>`, 'head end');
  }

  const target = lang === 'tr' ? path.join(dist, 'index.html') : path.join(dist, lang, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
}

// Derleme manifestosu yalnız bu adım içindir; yayına gitmez.
fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true });
console.log(`Built ${LANGS.length} language home shells${Object.keys(chunks).length ? ' with copy preloads' : ''}.`);
