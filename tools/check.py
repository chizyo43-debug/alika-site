from __future__ import annotations

import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
LANGS = ("tr", "en", "de", "es", "fr", "pt", "ru", "ja", "ko")
SLUGS = (
    "how-it-works",
    "ecosystem",
    "features",
    "age-groups",
    "content",
    "updates",
    "roadmap",
    "downloads",
    "contact",
)


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self.lang = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html":
            self.lang = values.get("lang") or ""
        for attr in ("href", "src"):
            value = values.get(attr)
            if value:
                self.links.append((attr, value))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def route_exists(value: str) -> bool:
    parsed = urlparse(value)
    if parsed.scheme or value.startswith(("mailto:", "tel:", "#")):
        return True
    path = parsed.path
    if not path.startswith("/"):
        return True
    if path.endswith("/"):
        return (DIST / path.lstrip("/") / "index.html").exists()
    target = DIST / path.lstrip("/")
    return target.exists() or (target / "index.html").exists()


def main() -> None:
    errors: list[str] = []
    locales = json.loads((ROOT / "src" / "data" / "locales.json").read_text(encoding="utf-8"))
    if tuple(locales) != LANGS:
        errors.append(f"Locale order/membership differs: {tuple(locales)}")

    expected_pages = 0
    for lang in LANGS:
        base = DIST if lang == "tr" else DIST / lang
        expected = [base / "index.html", *(base / slug / "index.html" for slug in SLUGS)]
        expected_pages += len(expected)
        for page in expected:
            if not page.exists():
                errors.append(f"Missing page: {page}")
                continue
            text = page.read_text(encoding="utf-8")
            parser = LinkParser()
            parser.feed(text)
            if parser.lang != lang:
                errors.append(f"Wrong lang in {page}: {parser.lang}")
            if '<link rel="canonical"' not in text:
                errors.append(f"No canonical: {page}")
            if text.count('rel="alternate" hreflang=') != len(LANGS):
                errors.append(f"Bad hreflang count: {page}")
            for attr, value in parser.links:
                if not route_exists(value):
                    errors.append(f"Broken {attr} in {page}: {value}")

        for slug in ("how-it-works", "features"):
            guide_page = base / slug / "index.html"
            if guide_page.exists():
                guide_text = guide_page.read_text(encoding="utf-8")
                if guide_text.count('class="guide-card reveal"') != 6:
                    errors.append(f"Guide card coverage is incomplete: {guide_page}")
                if guide_text.count('class="mini-demo ') != 6:
                    errors.append(f"Guide animation coverage is incomplete: {guide_page}")

        content_page = base / "content" / "index.html"
        if content_page.exists():
            content_text = content_page.read_text(encoding="utf-8")
            if "data-direct-download" not in content_text:
                errors.append(f"Direct content download is missing: {content_page}")
            if "alika-icerik/archive/refs/heads/main.zip" not in content_text:
                errors.append(f"Content download does not target the ZIP archive: {content_page}")

    if expected_pages != 90:
        errors.append(f"Internal checker error, expected page count is {expected_pages}")

    for name in ("privacy", "eula"):
        source = ROOT / "legal" / f"{name}.html"
        for target in (DIST / f"{name}.html", DIST / name / "index.html"):
            if not target.exists() or digest(source) != digest(target):
                errors.append(f"Legal file changed or missing: {target}")

    if (DIST / "privacy-policy.html").read_bytes() != (ROOT / "legal" / "privacy.html").read_bytes():
        errors.append("privacy-policy.html differs from source")

    if (DIST / "CNAME").read_text(encoding="utf-8").strip() != "www.alika.tr":
        errors.append("CNAME is not www.alika.tr")

    forbidden = re.compile(r"(google-analytics|googletagmanager|facebook\.net|hotjar|segment\.com)", re.I)
    for page in DIST.rglob("*.html"):
        if forbidden.search(page.read_text(encoding="utf-8")):
            errors.append(f"Tracker marker in {page}")

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors))
        raise SystemExit(1)
    print(
        f"OK: {expected_pages} localized pages, 108 guide animations, direct content downloads, "
        "fixed legal routes, local links and tracker fence"
    )


if __name__ == "__main__":
    main()
