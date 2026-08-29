from __future__ import annotations

import hashlib
import json
import re
import zipfile
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
MICROSOFT_STORE_ID = "9N3P9F5ZKR5S"
MICROSOFT_STORE_CID = "cid=site_home_tr"
BOOK_LANGUAGE_PATHS = ("/en/", "/de/", "/es/", "/fr/", "/pt/", "/ru/", "/ja/", "/ko/")
GUIDE_SLUGS = (
    "windows-11-cocuk-ekran-suresi",
    "soru-cozerek-ekran-suresi-kazanma",
    "bulutsuz-ebeveyn-kontrolu",
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
            if "data-content-country" not in content_text or "data-content-grade" not in content_text:
                errors.append(f"Country/grade catalog controls are missing: {content_page}")

        downloads_page = base / "downloads" / "index.html"
        if downloads_page.exists():
            downloads_text = downloads_page.read_text(encoding="utf-8")
            if (
                "apps.microsoft.com" not in downloads_text
                or MICROSOFT_STORE_ID not in downloads_text
                or MICROSOFT_STORE_CID not in downloads_text
            ):
                errors.append(f"Microsoft Store link is missing: {downloads_page}")
            if '"@type":"SoftwareApplication"' not in downloads_text:
                errors.append(f"SoftwareApplication schema is missing: {downloads_page}")

    if expected_pages != 90:
        errors.append(f"Internal checker error, expected page count is {expected_pages}")

    guide_pages = [DIST / "rehber" / "index.html", *(DIST / "rehber" / slug / "index.html" for slug in GUIDE_SLUGS)]
    for page in guide_pages:
        if not page.exists():
            errors.append(f"Missing Turkish guide page: {page}")
            continue
        guide_text = page.read_text(encoding="utf-8")
        if '<link rel="canonical"' not in guide_text:
            errors.append(f"No canonical: {page}")
        if 'type="application/ld+json"' not in guide_text:
            errors.append(f"Structured data is missing: {page}")
        parser = LinkParser()
        parser.feed(guide_text)
        for attr, value in parser.links:
            if not route_exists(value):
                errors.append(f"Broken {attr} in {page}: {value}")

    for slug in GUIDE_SLUGS:
        page = DIST / "rehber" / slug / "index.html"
        if page.exists() and MICROSOFT_STORE_CID not in page.read_text(encoding="utf-8"):
            errors.append(f"Campaign CID is missing from guide CTA: {page}")

    catalog_path = DIST / "icerik" / "catalog-v1.json"
    alias_path = DIST / "icerik" / "index.html"
    if not alias_path.exists():
        errors.append("Turkish /icerik/ alias is missing")
    if not catalog_path.exists():
        errors.append("Content catalog JSON is missing")
    else:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        if catalog.get("schema") != "alika-content-catalog/v1":
            errors.append("Content catalog schema is invalid")
        if not catalog.get("grades") or not catalog.get("subjects"):
            errors.append("Content catalog is empty")
        for subject in catalog.get("subjects", []):
            target = DIST / subject["download_url"].lstrip("/")
            if not target.exists() or digest(target) != subject["sha256"]:
                errors.append(f"Subject artifact missing or hash mismatch: {target}")
        for grade in catalog.get("grades", []):
            target = DIST / grade["download_url"].lstrip("/")
            if not target.exists() or digest(target) != grade["sha256"]:
                errors.append(f"Grade artifact missing or hash mismatch: {target}")
                continue
            try:
                with zipfile.ZipFile(target) as archive:
                    manifest = json.loads(archive.read("MANIFEST.json"))
                    if manifest.get("schema") != "alika-class-bundle/v1":
                        errors.append(f"Grade bundle manifest schema is invalid: {target}")
                    declared = {row["path"] for row in manifest.get("packages", [])}
                    if set(archive.namelist()) != declared | {"MANIFEST.json"}:
                        errors.append(f"Grade bundle entries differ from manifest: {target}")
                    for package in manifest.get("packages", []):
                        actual = hashlib.sha256(archive.read(package["path"])).hexdigest()
                        if actual != package["sha256"]:
                            errors.append(f"Grade bundle member hash mismatch: {target}:{package['path']}")
            except (KeyError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
                errors.append(f"Grade bundle is invalid: {target}: {exc}")

    for name in ("privacy", "eula"):
        source = ROOT / "legal" / f"{name}.html"
        for target in (DIST / f"{name}.html", DIST / name / "index.html"):
            if not target.exists() or digest(source) != digest(target):
                errors.append(f"Legal file changed or missing: {target}")

    if (DIST / "privacy-policy.html").read_bytes() != (ROOT / "legal" / "privacy.html").read_bytes():
        errors.append("privacy-policy.html differs from source")

    if (DIST / "CNAME").read_text(encoding="utf-8").strip() != "www.alika.tr":
        errors.append("CNAME is not www.alika.tr")

    book_bundles = tuple((DIST / "assets").glob("index-*.js"))
    book_bundle_text = "\n".join(bundle.read_text(encoding="utf-8") for bundle in book_bundles)
    if not book_bundles or MICROSOFT_STORE_ID not in book_bundle_text or "site_home_" not in book_bundle_text:
        errors.append("Microsoft Store link is missing from the book experience")
    if "bookLanguagePicker" not in book_bundle_text or not all(
        path in book_bundle_text for path in BOOK_LANGUAGE_PATHS
    ):
        errors.append("Language picker is missing or incomplete in the book experience")
    for lang in LANGS:
        flag = DIST / "flags" / f"{lang}.svg"
        if not flag.exists():
            errors.append(f"Language flag is missing: {flag}")

    localized_book_pages = [DIST / "index.html", *(DIST / lang / "index.html" for lang in LANGS[1:])]
    root_bundle_names: set[str] | None = None
    for page in localized_book_pages:
        if not page.exists():
            continue
        page_text = page.read_text(encoding="utf-8")
        parser = LinkParser()
        parser.feed(page_text)
        bundle_names = {
            value for attr, value in parser.links
            if attr == "src" and re.search(r"/assets/index-[^/]+\.js$", value)
        }
        if not bundle_names:
            errors.append(f"Interactive book bundle is missing from language root: {page}")
        elif root_bundle_names is None:
            root_bundle_names = bundle_names
        elif bundle_names != root_bundle_names:
            errors.append(f"Language root does not use the same book bundle: {page}")

    root_page = (DIST / "index.html").read_text(encoding="utf-8")
    if '<script type="application/ld+json">' not in root_page or '"SoftwareApplication"' not in root_page:
        errors.append("SoftwareApplication schema is missing from the Turkish home page")
    if "Ekran süresini kavgaya değil öğrenmeye dönüştürün." not in root_page:
        errors.append("Turkish home page is not pre-rendered with the campaign message")
    if "yalnız Windows sürümünü kapsar" not in root_page:
        errors.append("Windows-only Store purchase scope is missing from the Turkish home page")
    if MICROSOFT_STORE_CID not in root_page:
        errors.append("Campaign CID is missing from the Turkish home page")

    forbidden = re.compile(r"(google-analytics|googletagmanager|facebook\.net|hotjar|segment\.com)", re.I)
    for page in DIST.rglob("*.html"):
        if forbidden.search(page.read_text(encoding="utf-8")):
            errors.append(f"Tracker marker in {page}")

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors))
        raise SystemExit(1)
    print(
        f"OK: {expected_pages} localized pages, {len(guide_pages)} Turkish guide pages, "
        "108 guide animations, verified catalog downloads, fixed legal routes, local links and tracker fence"
    )


if __name__ == "__main__":
    main()
