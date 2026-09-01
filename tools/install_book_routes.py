from __future__ import annotations

import html
import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
LOCALES = ROOT / "src" / "data" / "locales.json"
LANGS = ("en", "de", "es", "fr", "pt", "ru", "ja", "ko")
BASE_URL = "https://www.alika.tr"


def escaped(value: object) -> str:
    return html.escape(str(value), quote=True)


def replace_meta(document: str, lang: str, copy: dict[str, object]) -> str:
    title = f"{copy['name']} | AliKa"
    description = str(copy["meta"])
    canonical = f"{BASE_URL}/{lang}/"
    replacements = (
        (r'<html lang="[^"]+">', f'<html lang="{lang}">'),
        (r"<title>.*?</title>", f"<title>{escaped(title)}</title>"),
        (r'(<meta name="description" content=")[^"]*(" />)', rf"\g<1>{escaped(description)}\g<2>"),
        (r'(<link rel="canonical" href=")[^"]*(" />)', rf"\g<1>{canonical}\g<2>"),
        (r'(<meta property="og:locale" content=")[^"]*(" />)', rf"\g<1>{escaped(copy['locale'])}\g<2>"),
        (r'(<meta property="og:url" content=")[^"]*(" />)', rf"\g<1>{canonical}\g<2>"),
        (r'(<meta property="og:title" content=")[^"]*(" />)', rf"\g<1>{escaped(title)}\g<2>"),
        (r'(<meta property="og:description" content=")[^"]*(" />)', rf"\g<1>{escaped(description)}\g<2>"),
        (r'(<meta name="twitter:title" content=")[^"]*(" />)', rf"\g<1>{escaped(title)}\g<2>"),
        (r'(<meta name="twitter:description" content=")[^"]*(" />)', rf"\g<1>{escaped(description)}\g<2>"),
    )
    for pattern, replacement in replacements:
        document = re.sub(pattern, replacement, document, count=1, flags=re.DOTALL)
    return document.replace("cid=site_home_tr", f"cid=site_home_{lang}")


def fallback_markup(lang: str, copy: dict[str, object]) -> str:
    return (
        '<div id="root">'
        '<main class="bookBootStage" aria-label="AliKa product book">'
        f'<span class="bookBootLang"><img src="/flags/{lang}.svg" alt="" width="28" height="19"><span>{escaped(copy["name"])}</span><i>⌄</i></span>'
        '<div class="bookBootBook"><div class="bookBootCover">'
        f'<small>{escaped(copy["hero_kicker"])}</small>'
        '<img src="/brand/alika-logo.png" alt="AliKa" width="208" height="144">'
        '<strong>AliKa</strong>'
        f'<p>{escaped(copy["meta"])}</p>'
        f'<span class="bookBootPrompt">{escaped(copy["hero_alt"])}</span>'
        '</div></div>'
        '<section class="bootSeoText">'
        f'<h1>{escaped(copy["hero_title"])}</h1>'
        f'<p>{escaped(copy["hero_body"])}</p>'
        f'<a href="https://apps.microsoft.com/detail/9N3P9F5ZKR5S?cid=site_home_{lang}">{escaped(copy["get"])}</a>'
        '</section>'
        '</main>'
        '</div>'
    )


def main() -> None:
    source = (DIST / "index.html").read_text(encoding="utf-8")
    locales = json.loads(LOCALES.read_text(encoding="utf-8"))
    for lang in LANGS:
        document = replace_meta(source, lang, locales[lang])
        fallback = fallback_markup(lang, locales[lang])
        document, count = re.subn(
            r'<div id="root">.*?</main>\s*</div>',
            fallback,
            document,
            count=1,
            flags=re.DOTALL,
        )
        if count != 1:
            raise RuntimeError(f"Book root could not be installed for {lang}")
        target = DIST / lang / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(document, encoding="utf-8")
    endpoint = os.environ.get("ALIKA_ASSISTANT_ENDPOINT", "").strip().rstrip("/")
    if endpoint and not endpoint.startswith("https://"):
        raise RuntimeError("ALIKA_ASSISTANT_ENDPOINT must use HTTPS")
    config = f"window.ALIKA_ASSISTANT_CONFIG = Object.freeze({json.dumps({'endpoint': endpoint}, ensure_ascii=False, separators=(',', ':'))});\n"
    for target in (DIST / "site-assistant-config.js", DIST / "assets" / "site-assistant-config.js"):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(config, encoding="utf-8")
    print(f"Installed the interactive book shell on {len(LANGS)} language routes")


if __name__ == "__main__":
    main()
