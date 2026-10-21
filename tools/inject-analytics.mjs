// Cloudflare Web Analytics: çerezsiz JS işaretçisi (elle kurulum; alan adı Cloudflare üzerinden geçmez).
// Belirteç tek yerde: src/data/analytics.json → cloudflareWebAnalyticsToken.
// Boşsa hiçbir sayfaya etiket yazılmaz. Doluysa dist'teki her herkese açık HTML sayfasına, </body>
// öncesine tam bir etiket eklenir. Yalnız yönlendirme sayfaları (meta refresh) atlanır: hemen başka
// adrese geçtikleri için ölçülecek bir şeyleri yoktur. tools/build.py ve npm run build:home'dan sonra çalışır;
// tools/check.py aynı etiketi bekler.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'analytics.json'), 'utf8'));
const token = String(config.cloudflareWebAnalyticsToken ?? '').trim();

const START = '<!-- Cloudflare Web Analytics -->';
const END = '<!-- End Cloudflare Web Analytics -->';
// Cloudflare'in güncel elle kurulum biçimi (2026-07'den beri defer yerine type="module").
const beacon = (value) =>
  `${START}<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${value}"}'></script>${END}\n`;

if (token && !/^[A-Za-z0-9_-]{8,128}$/.test(token)) {
  throw new Error('analytics.json: cloudflareWebAnalyticsToken must be the site token from the Cloudflare snippet (letters, digits, - or _)');
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

const existing = new RegExp(`${START}[\\s\\S]*?${END}\\n?`, 'g');
let tagged = 0;
let skipped = 0;
for (const file of htmlFiles(dist)) {
  const original = fs.readFileSync(file, 'utf8');
  // Aynı derlemede ikinci kez çalışırsa eski etiketi kaldırır; belirteç boşaltıldıysa etiket kalmaz.
  let html = original.replace(existing, '');
  if (token) {
    if (html.includes('http-equiv="refresh"')) {
      skipped += 1;
    } else {
      const ends = html.match(/<\/body>/g) ?? [];
      if (ends.length !== 1) throw new Error(`${path.relative(dist, file)}: expected one </body>, found ${ends.length}`);
      html = html.replace('</body>', () => `${beacon(token)}</body>`);
      tagged += 1;
    }
  }
  if (html !== original) fs.writeFileSync(file, html, 'utf8');
}

console.log(
  token
    ? `Cloudflare Web Analytics beacon added to ${tagged} pages (${skipped} redirect pages skipped).`
    : 'Cloudflare Web Analytics token is empty; no beacon added.',
);
