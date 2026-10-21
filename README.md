# AliKa website

Static, multilingual product website for `www.alika.tr`.

## Build

```powershell
npm ci
python tools/build.py
npm run build:home
npm run typecheck
python tools/check.py
```

The generated GitHub Pages output is written to `dist/` (same steps as
`.github/workflows/pages.yml`). The deployed site sets no cookies and has no
external CDN, AI assistant, or application connection. Its only third-party
script is the optional Cloudflare Web Analytics beacon described below.

## Analytics (Cloudflare Web Analytics)

The site can use Cloudflare Web Analytics, a cookieless JS beacon. The DNS for
`alika.tr` is not on Cloudflare, so only the manual JS snippet works.

- The token goes in `src/data/analytics.json` → `cloudflareWebAnalyticsToken`.
  This is the only place. The token is public (it appears in every page's HTML),
  so it is not a secret.
- To get it: Cloudflare dashboard → Web Analytics → Add a site → enter
  `www.alika.tr` → choose the manual JS snippet. The snippet contains
  `data-cf-beacon='{"token": "…"}'`; copy only that token value.
- Empty token = no beacon on any page. With a token, `tools/inject-analytics.mjs`
  (last step of `npm run build:home`) adds one beacon right before `</body>` on
  every public page in `dist/`. Redirect pages (meta refresh) are skipped.
- `tools/check.py` allows `static.cloudflareinsights.com` as the only external
  script origin. With a token it requires exactly one beacon per public page and
  the Cloudflare Web Analytics section in the privacy policy (EN and TR); with an
  empty token it requires that no page has a beacon.
- The site has no Content-Security-Policy. If one is added later, it must allow
  `https://static.cloudflareinsights.com` (script) and
  `https://cloudflareinsights.com` (connect).

## Social links

The social profile URLs and their icons live in `src/data/social.json`. The home
footer (`src/home/Home.tsx`), the static page footer (`tools/build.py`) and the
home JSON-LD `sameAs` (`tools/build-language-homes.mjs`) read from that file;
the accessible names are in `src/home/i18n/*.ts` (`footer.social`). `index.html`
carries the same `sameAs` list for the Vite shell.

The fixed legal routes are `/privacy/` and `/eula/`.

