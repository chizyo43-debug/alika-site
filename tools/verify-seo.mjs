import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'locales.json'), 'utf8'));
const errors = [];

function checkCopy(language, copy) {
  const titleLength = [...copy.seo_title].length;
  const descriptionLength = [...copy.seo_description].length;
  if (titleLength < 28 || titleLength > 65) errors.push(`${language}: SEO title length is ${titleLength}; expected 28-65`);
  if (descriptionLength < 70 || descriptionLength > 160) errors.push(`${language}: SEO description length is ${descriptionLength}; expected 70-160`);
}

function escapedAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function checkHomeHead(language, html, label) {
  const copy = locales[language];
  if (!html.includes(`<title>${copy.seo_title}</title>`)) errors.push(`${label}: title does not match locale SEO title`);
  if (!new RegExp(`name="description" content="${escapedAttribute(copy.seo_description).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) {
    errors.push(`${label}: description does not match locale SEO description`);
  }
  if (/name="robots" content="[^"]*noindex/i.test(html)) errors.push(`${label}: home page must not be noindex`);
}

for (const [language, copy] of Object.entries(locales)) checkCopy(language, copy);

const mode = process.argv[2];
if (mode === '--source') {
  // Türkçe ana sayfa: yeni React ana sayfasının kabuğu (index.html).
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  checkHomeHead('tr', html, 'index.html');
  if (!html.includes('<link rel="canonical" href="https://www.alika.tr/" />')) errors.push('index.html: canonical is missing');
  if ((html.match(/rel="alternate" hreflang=/g) || []).length !== Object.keys(locales).length) errors.push('index.html: hreflang set is incomplete');
  if (/alt=""/.test(html)) errors.push('home shell images must have descriptive alt text');
} else if (mode === '--dist') {
  for (const language of Object.keys(locales)) {
    const file = language === 'tr' ? path.join(root, 'dist', 'index.html') : path.join(root, 'dist', language, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    checkHomeHead(language, html, `${language} built home`);
  }
  if (/alt=""/.test(fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8'))) errors.push('tr: built home shell image has empty alt text');
} else {
  errors.push('use --source or --dist');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Home SEO ${mode === '--dist' ? 'build' : 'source'} checks passed for ${Object.keys(locales).length} languages.`);
}
