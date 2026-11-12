// Vite'ın ürettiği dist/index.html kabuğundan her dil için ana sayfa kabuğu üretir.
// React aynı paketi kullanır; dil, adresin ilk parçasından seçilir. Burada yalnız arama
// motorlarının ve JavaScript çalışmadan açılan sayfanın gördüğü başlık, açıklama,
// yapılandırılmış veri ve kısa metin o dile çevrilir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentPath, GUIDE_PATHS, homePath, LANGS, legalPath } from '../src/home/i18n/langs.ts';
import { microsoftStoreUrl, playStoreUrl } from '../src/store-campaign.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const BASE_URL = 'https://www.alika.tr';
const locales = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'locales.json'), 'utf8'));
// AliKa'nın sosyal medya hesapları; yapılandırılmış veride uygulamanın sameAs listesi olur (altlıkla aynı liste).
const socialUrls = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'social.json'), 'utf8')).profiles.map((profile) => profile.url);
// Ortak paylaşım görselindeki yazı Türkçe; Japonca sayfa yazısı Japonca olan og-ja.jpg'yi kullanır.
// Alt metin her dilde o dilin gördüğü görseli anlatır.
const OG_IMAGE_FILE = { ja: 'og-ja.jpg' };
const OG_IMAGE_ALT = {
  tr: 'AliKa logosu, “Kısıtlamıyoruz. Planlıyoruz.” sloganı ve gülümseyen AliKa maskotu. Windows ve Android; Microsoft Store ve Google Play.',
  en: 'AliKa logo, the Turkish slogan “We don’t restrict. We plan.” and the smiling AliKa mascot. Windows and Android; Microsoft Store and Google Play.',
  de: 'AliKa-Logo, der türkische Slogan „Wir verbieten nicht. Wir planen.“ und das lächelnde AliKa-Maskottchen. Windows und Android; Microsoft Store und Google Play.',
  es: 'Logotipo de AliKa, el lema en turco «No restringimos. Planificamos.» y la mascota sonriente de AliKa. Windows y Android; Microsoft Store y Google Play.',
  fr: 'Logo AliKa, le slogan en turc « Nous ne restreignons pas. Nous planifions. » et la mascotte AliKa souriante. Windows et Android ; Microsoft Store et Google Play.',
  pt: 'Logotipo da AliKa, o slogan em turco “Não restringimos. Planejamos.” e o mascote sorridente da AliKa. Windows e Android; Microsoft Store e Google Play.',
  ru: 'Логотип AliKa, слоган на турецком «Мы не запрещаем. Мы планируем.» и улыбающийся талисман AliKa. Windows и Android; Microsoft Store и Google Play.',
  ja: 'AliKaのロゴ、スローガン「制限しない。計画する。」、笑顔のAliKaマスコット。WindowsとAndroid、Microsoft StoreとGoogle Play。',
  ko: 'AliKa 로고, 튀르키예어 슬로건 “막지 않습니다. 계획합니다.”, 웃고 있는 AliKa 마스코트. Windows와 Android, Microsoft Store와 Google Play.',
};
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
    // Türkçe marka adı Türkçe sayfada; İngilizce ad diğer dillerde ve alternatif ad olarak kalır.
    name: lang === 'tr' ? 'AliKa Ebeveyn Kontrolü' : 'AliKa Parental Control',
    alternateName: lang === 'tr' ? ['AliKa', 'AliKa Parental Control'] : ['AliKa'],
    description: copy.seo.schemaDescription,
    inLanguage: lang,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Parental control',
    operatingSystem: 'Windows 10, Windows 11, Android',
    url: canonical,
    downloadUrl: storeUrl,
    publisher: { '@type': 'Organization', name: 'ErenKa Software' },
    featureList: copy.seo.featureList,
    sameAs: socialUrls,
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
  const ld = (value) => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;
  if (lang !== 'tr') return ld(data);
  // Google arama sonucundaki site adını kök ana sayfadaki WebSite şemasından alır.
  const site = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AliKa Ebeveyn Kontrolü',
    alternateName: ['AliKa'],
    url: `${BASE_URL}/`,
  };
  return `${ld(data)}\n    ${ld(site)}`;
}

const SUPPORT_EMAIL = 'destek@alika.tr';

// JavaScript çalıştırmayan okuyucu (bazı arama motorları, yapay zekâ asistanlarının tarayıcıları, önizleme araçları)
// sayfanın yazısını buradan okur: React'in çizdiği bölümlerle aynı metin, aynı sırayla, dil dosyasından üretilir.
// React açılınca bu blok silinir. İç içe <section> kullanılmaz; kabuktaki blok ilk </section>'a kadar değiştirilir.
function fallback(lang, copy, storeUrl, playUrl) {
  const h2 = (text) => `<h2>${esc(text)}</h2>`;
  const h3 = (text) => `<h3>${esc(text)}</h3>`;
  const p = (text) => `<p>${esc(text)}</p>`;
  const ul = (items) => `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
  const link = (href, text) => `<a href="${esc(href)}">${esc(text.replace(/\s*[→↗]\s*$/, ''))}</a>`;
  const pairs = (items) => `<dl>${items.map((item) => `<dt>${esc(item.title ?? item.name)}</dt><dd>${esc(item.body)}</dd>`).join('')}</dl>`;
  const featureGroup = (group) => [h3(group.title), p(group.lead), pairs(Object.values(group.items))];
  const offer = (side) => [h3(`${side.title}: ${side.trial}`), ul(side.points)];
  const { platforms } = copy;
  const guidesIndex = GUIDE_PATHS[lang];

  const parts = [
    `<h1>${esc(copy.seo.h1)}</h1>`,
    p(copy.cta.pitch),
    p(copy.intro.lead.join('')),
    p(copy.seo.pricing),
    `<a href="${esc(storeUrl)}">Microsoft Store</a>`,
    `<a href="${esc(playUrl)}">Google Play</a>`,
    p(copy.cta.trustLine),
    p(copy.cta.appleNote),
    pairs(copy.intro.stats.map((stat) => ({ title: stat.value, body: stat.label }))),

    h2(copy.rail.title),
    p(copy.rail.lead),
    ...[platforms.windows, platforms.android, platforms.tv].flatMap((platform) => [h3(platform.title), p(platform.body)]),
    pairs(Object.values(platforms.tv.games)),
    link(`${contentPath(lang)}#oyunlar`, platforms.tv.packs),

    h2(copy.audiences.title),
    p(copy.audiences.lead),
    ...Object.values(copy.audiences.items).flatMap((item) => [h3(item.title), p(item.body), ul(item.points)]),

    h2(copy.features.title),
    p(copy.features.lead),
    ...featureGroup(copy.features.control),
    ...featureGroup(copy.features.learning),
    ...featureGroup(copy.features.family),

    h2(copy.how.title),
    p(copy.how.lead),
    `<ol>${copy.how.steps.map((step) => `<li><strong>${esc(step.title)}</strong> ${esc(step.body)}</li>`).join('')}</ol>`,

    h2(copy.ages.title),
    p(copy.ages.lead),
    pairs(copy.ages.items),

    h2(copy.trust.title),
    pairs(copy.trust.items),
    link(legalPath(lang, 'privacy'), copy.trust.privacyLink),

    h2(copy.about.title),
    ...copy.about.story.map(p),
    p(copy.about.signature),
    h3(copy.about.planTitle),
    ...copy.about.plan.flatMap((group) => [`<h4>${esc(group.label)}</h4>`, ul(group.items)]),
    link(contentPath(lang), copy.about.contentLink),

    h2(copy.offer.title),
    p(copy.offer.lead),
    ...offer(copy.offer.windows),
    ...offer(copy.offer.android),
    p(copy.offer.note),

    h2(copy.faq.title),
    ...copy.faq.items.flatMap((item) => [h3(item.q), p(item.a)]),
  ];

  if (copy.guides) {
    parts.push(
      h2(copy.guides.title),
      p(copy.guides.lead),
      `<ul>${copy.guides.items.map((guide) => `<li>${link(guide.href, guide.title)}: ${esc(guide.body)}</li>`).join('')}</ul>`,
    );
    if (guidesIndex) parts.push(link(guidesIndex, copy.guides.all));
  }

  parts.push(
    h2(copy.contact.title),
    p(copy.contact.lead),
    `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`,
    link(legalPath(lang, 'terms'), copy.footer.terms),
  );
  if (copy.footer.schools) parts.push(link('/okullar/', copy.footer.schools));
  if (copy.footer.tokushoho) parts.push(link('/ja/tokushoho/', copy.footer.tokushoho));

  return `<section class="seoFallback">\n        ${parts.join('\n        ')}\n      </section>`;
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
  const playUrl = playStoreUrl(lang, '');

  let html = template;
  html = replaceOnce(html, /<html lang="[^"]*">/, `<html lang="${lang}">`, 'html lang');
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(seo.seo_title)}</title>`, 'title');
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`, 'canonical');
  html = setMeta(html, 'name', 'description', seo.seo_description);
  html = setMeta(html, 'property', 'og:locale', OG_LOCALES[lang]);
  html = setMeta(html, 'property', 'og:url', canonical);
  // Türkçe sayfada Türkçe marka adı; diğer dillerde kısa ad (statik sayfalarla aynı).
  html = setMeta(html, 'property', 'og:site_name', lang === 'tr' ? 'AliKa Ebeveyn Kontrolü' : 'AliKa');
  html = setMeta(html, 'property', 'og:title', seo.seo_title);
  html = setMeta(html, 'property', 'og:description', seo.seo_description);
  html = setMeta(html, 'name', 'twitter:title', seo.seo_title);
  html = setMeta(html, 'name', 'twitter:description', seo.seo_description);
  const ogImage = `${BASE_URL}/${OG_IMAGE_FILE[lang] ?? 'og.jpg'}`;
  html = setMeta(html, 'property', 'og:image', ogImage);
  html = setMeta(html, 'name', 'twitter:image', ogImage);
  html = setMeta(html, 'property', 'og:image:alt', OG_IMAGE_ALT[lang]);
  html = setMeta(html, 'name', 'twitter:image:alt', OG_IMAGE_ALT[lang]);
  html = replaceOnce(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, schema(lang, copy, canonical, storeUrl), 'ld+json');
  html = replaceOnce(html, /<section class="seoFallback">[\s\S]*?<\/section>/, fallback(lang, copy, storeUrl, playUrl), 'seo fallback');
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
