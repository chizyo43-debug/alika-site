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

for (const [language, copy] of Object.entries(locales)) checkCopy(language, copy);

const mode = process.argv[2];
if (mode === '--source') {
  const source = fs.readFileSync(path.join(root, 'src', 'book-experience.tsx'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (!source.includes('document.title = copy.seo_title')) errors.push('interactive book must preserve the localized SEO title');
  if (!source.includes("meta[name=\"description\"]") || !source.includes("setAttribute('content', copy.seo_description)")) errors.push('interactive book must preserve the localized SEO description');
  if (/alt=""/.test(source)) errors.push('interactive book images must have descriptive alt text');
  if (/alt=""/.test(html)) errors.push('boot homepage images must have descriptive alt text');
} else if (mode === '--dist') {
  for (const [language, copy] of Object.entries(locales)) {
    const file = language === 'tr' ? path.join(root, 'dist', 'index.html') : path.join(root, 'dist', language, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(`<title>${copy.seo_title}</title>`)) errors.push(`${language}: built title does not match locale SEO title`);
    if (!html.includes(`name="description" content="${copy.seo_description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`)) errors.push(`${language}: built description does not match locale SEO description`);
    if (/alt=""/.test(html)) errors.push(`${language}: built homepage image has empty alt text`);
  }
} else {
  errors.push('use --source or --dist');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Book SEO ${mode === '--dist' ? 'build' : 'source'} checks passed for ${Object.keys(locales).length} languages.`);
}
