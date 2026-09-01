# AliKa website

Static, multilingual product website for `www.alika.tr`.

## Build

```powershell
python tools/build.py
```

The generated GitHub Pages output is written to `dist/`. The deployed site has
no analytics, cookies, external CDN, or application connection. The optional
site assistant is activated only when `ALIKA_ASSISTANT_ENDPOINT` is set during
`npm run build:book`; its Cloud Run backend lives in `assistant-service/`.

The fixed legal routes are `/privacy/` and `/eula/`.

