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
# Eski alt sayfalar yeni ana sayfanın bölümlerine yönlenir (tools/build.py ile aynı tablo).
REDIRECT_ANCHORS = {
    "how-it-works": "nasil",
    "ecosystem": "platformlar",
    "features": "ozellikler",
    "age-groups": "yas",
    "updates": "platformlar",
    "roadmap": "platformlar",
    "downloads": "platformlar",
    "contact": "iletisim",
}
MICROSOFT_STORE_ID = "9N3P9F5ZKR5S"
STORE_OFFER_MARKERS = {
    "tr": ('"price":"80.00"', '"priceCurrency":"TRY"'),
    "ja": ('"price":"230"', '"priceCurrency":"JPY"'),
    "ko": ('"price":"2500"', '"priceCurrency":"KRW"'),
}
PLAY_STORE_PACKAGE = "com.alika.parental"
GUIDE_SLUGS = (
    "windows-cocuk-ekran-suresi-nasil-yonetilir",
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
        home_href = "/" if lang == "tr" else f"/{lang}/"
        home_page = base / "index.html"
        content_page = base / "content" / "index.html"
        for page in (home_page, content_page):
            expected_pages += 1
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
            if re.search(r'name="robots" content="[^"]*noindex', text, re.I):
                errors.append(f"Indexable page is noindex: {page}")
            for attr, value in parser.links:
                if not route_exists(value):
                    errors.append(f"Broken {attr} in {page}: {value}")

        # Dil ana sayfası: Vite ile derlenen yeni ana sayfa ve o dilin kabuğu.
        if home_page.exists():
            home_text = home_page.read_text(encoding="utf-8")
            parser = LinkParser()
            parser.feed(home_text)
            if not any(attr == "src" and re.search(r"/assets/index-[^/]+\.js$", value) for attr, value in parser.links):
                errors.append(f"New home page bundle is missing: {home_page}")
            if f'<link rel="canonical" href="https://www.alika.tr{home_href}"' not in home_text:
                errors.append(f"Home canonical is wrong: {home_page}")
            if '<script type="application/ld+json">' not in home_text or '"@type":"SoftwareApplication"' not in home_text:
                errors.append(f"SoftwareApplication schema is missing: {home_page}")
            if f'"inLanguage":"{lang}"' not in home_text:
                errors.append(f"Schema language is wrong: {home_page}")
            for marker in STORE_OFFER_MARKERS.get(lang, ()):
                if marker not in home_text:
                    errors.append(f"Localized Store offer is missing ({marker}): {home_page}")
            if lang not in STORE_OFFER_MARKERS and '"offers"' in home_text:
                errors.append(f"Unverified Store price is published: {home_page}")
            if f"apps.microsoft.com/detail/{MICROSOFT_STORE_ID}?cid=site_home_{lang}" not in home_text:
                errors.append(f"Microsoft Store link is missing: {home_page}")
            play_campaign = f"utm_source%3Dsite%26utm_medium%3Dweb%26utm_campaign%3Dsite_home_{lang}"
            if f"details?id={PLAY_STORE_PACKAGE}&amp;hl={lang}&amp;referrer={play_campaign}" not in home_text:
                errors.append(f"Google Play link is missing: {home_page}")
            if '<section class="seoFallback">' not in home_text or "<h1>" not in home_text:
                errors.append(f"Pre-rendered home summary is missing: {home_page}")
            if '<meta property="og:image" content="https://www.alika.tr/og.jpg"' not in home_text or 'property="og:image:alt"' not in home_text:
                errors.append(f"Share image is missing: {home_page}")
            if "/assets/screenshots/" in home_text or "ALTIN" in home_text:
                errors.append(f"Obsolete mascot screenshot remains: {home_page}")

        if content_page.exists():
            content_text = content_page.read_text(encoding="utf-8")
            if 'class="content-route"' not in content_text or "content-book-shell" not in content_text:
                errors.append(f"Book catalogue shell is missing: {content_page}")
            if "data-direct-download" not in content_text:
                errors.append(f"Direct content download is missing: {content_page}")
            if "data-content-country" not in content_text or "data-content-grade" not in content_text:
                errors.append(f"Country/grade catalog controls are missing: {content_page}")
            if 'aria-label="Language"' not in content_text or "aria-hidden=\"true\">" not in content_text:
                errors.append(f"Flagged language selector is missing: {content_page}")

        # Eski alt sayfalar: dizine girmeyen, yeni ana sayfanın bölümüne yönlenen kısa sayfa.
        for slug, anchor in REDIRECT_ANCHORS.items():
            expected_pages += 1
            page = base / slug / "index.html"
            if not page.exists():
                errors.append(f"Missing redirect: {page}")
                continue
            text = page.read_text(encoding="utf-8")
            target = f"{home_href}#{anchor}"
            if f'<meta http-equiv="refresh" content="0; url={target}">' not in text:
                errors.append(f"Redirect target is wrong: {page}")
            if '<meta name="robots" content="noindex">' not in text:
                errors.append(f"Redirect must be noindex: {page}")
            if f'<html lang="{lang}">' not in text:
                errors.append(f"Wrong lang in redirect: {page}")

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

    # Her rehberin kendi kampanya adı; iki platformlu rehberlerde Play düğmesi aynı adı taşır.
    guide_campaigns = {
        "windows-cocuk-ekran-suresi-nasil-yonetilir": ("organic_guide_windows_tr", False),
        "windows-11-cocuk-ekran-suresi": ("site_rehber_windows11_tr", False),
        "soru-cozerek-ekran-suresi-kazanma": ("site_rehber_soru_coz_tr", True),
        "bulutsuz-ebeveyn-kontrolu": ("site_rehber_bulutsuz_tr", True),
    }
    for slug in GUIDE_SLUGS:
        page = DIST / "rehber" / slug / "index.html"
        if not page.exists():
            continue
        guide_text = page.read_text(encoding="utf-8")
        campaign, has_play = guide_campaigns[slug]
        if f"cid={campaign}" not in guide_text:
            errors.append(f"Campaign CID is missing from guide CTA: {page}")
        play_link = f"details?id={PLAY_STORE_PACKAGE}&amp;hl=tr&amp;referrer=utm_source%3Dsite%26utm_medium%3Drehber%26utm_campaign%3D{campaign}"
        if has_play != (play_link in guide_text):
            errors.append(f"Guide Google Play button is wrong: {page}")
        if "youtube.com" in guide_text or "youtu.be" in guide_text:
            errors.append(f"Guide video must play on the site, not on YouTube: {page}")

    uk_pages = (
        DIST / "en" / "guides" / "windows-child-screen-time" / "index.html",
        DIST / "en" / "uk-windows-screen-time" / "index.html",
    )
    for page in uk_pages:
        if not page.exists():
            errors.append(f"Missing UK preparation page: {page}")
            continue
        uk_text = page.read_text(encoding="utf-8")
        if '<html lang="en">' not in uk_text or '<link rel="canonical"' not in uk_text:
            errors.append(f"UK language or canonical is missing: {page}")
        if 'type="application/ld+json"' not in uk_text:
            errors.append(f"UK structured data is missing: {page}")
        if "cid=community_guide_windows_uk_v1" not in uk_text:
            errors.append(f"UK campaign CID is missing: {page}")
        parser = LinkParser()
        parser.feed(uk_text)
        for attr, value in parser.links:
            if not route_exists(value):
                errors.append(f"Broken {attr} in {page}: {value}")

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
        content_release_tags = set((catalog.get("content_releases") or {}).values())
        if catalog.get("content_release"):
            content_release_tags.add(catalog["content_release"])
        if catalog.get("question_bank_release"):
            content_release_tags.add(catalog["question_bank_release"])
        totals = catalog.get("totals") or {}
        if totals != {
            "countries": 5,
            "gradeGroups": 38,
            "subjects": 300,
            "notes": 7906,
            "questions": 150732,
            "questionBanks": 39,
            "questionBankQuestions": 78000,
        }:
            errors.append(f"Content catalog totals are unexpected: {totals}")
        excluded = catalog.get("excluded") or []
        if excluded:
            errors.append(f"Ready content is still unexpectedly excluded: {excluded}")
        for subject in catalog.get("subjects", []):
            parsed = urlparse(subject["download_url"])
            if parsed.scheme:
                if (
                    parsed.scheme != "https"
                    or parsed.netloc != "github.com"
                    or not any(
                        f"/releases/download/{tag}/" in parsed.path
                        for tag in content_release_tags
                    )
                ):
                    errors.append(f"External subject artifact URL is not pinned: {subject['download_url']}")
                if not re.fullmatch(r"[0-9a-f]{64}", subject.get("sha256", "")):
                    errors.append(f"External subject hash is invalid: {subject.get('filename')}")
            else:
                target = DIST / subject["download_url"].lstrip("/")
                if not target.exists() or digest(target) != subject["sha256"]:
                    errors.append(f"Subject artifact missing or hash mismatch: {target}")
        question_banks = catalog.get("question_banks") or []
        if len(question_banks) != 39:
            errors.append(f"Expected 39 independent class question banks, got {len(question_banks)}")
        bank_country_counts = {
            country: sum(bank.get("country_code") == country for bank in question_banks)
            for country in ("TR", "JP", "KR", "GB", "RU")
        }
        if bank_country_counts != {"TR": 8, "JP": 8, "KR": 8, "GB": 8, "RU": 7}:
            errors.append(f"Independent class question bank coverage is incomplete: {bank_country_counts}")
        class_bank_keys = [
            (bank.get("country_code"), bank.get("grade"))
            for bank in question_banks
            if bank.get("scope") == "country-grade"
        ]
        if len(class_bank_keys) != 31 or len(set(class_bank_keys)) != 31:
            errors.append("JP/KR/GB/RU mixed class question bank keys are incomplete or duplicated")
        for bank in question_banks:
            minimum_families = 2000 if bank.get("country_code") == "TR" else 400
            if (
                bank.get("country_code") not in {"TR", "JP", "KR", "GB", "RU"}
                or bank.get("questions") != 2000
                or bank.get("families", 0) < minimum_families
                or bank.get("independent_from_subject_packages") is not True
                or bank.get("source_question_reuse") != "forbidden"
            ):
                errors.append(f"Question bank contract is invalid: {bank.get('filename')}")
            parsed = urlparse(bank["download_url"])
            if parsed.scheme:
                if (
                    parsed.scheme != "https"
                    or parsed.netloc != "github.com"
                    or not any(
                        f"/releases/download/{tag}/" in parsed.path
                        for tag in content_release_tags
                    )
                    or not re.fullmatch(r"[0-9a-f]{64}", bank.get("sha256", ""))
                ):
                    errors.append(f"External question bank URL/hash is invalid: {bank.get('filename')}")
            else:
                target = DIST / bank["download_url"].lstrip("/")
                if not target.exists() or digest(target) != bank["sha256"]:
                    errors.append(f"Question bank artifact missing or hash mismatch: {target}")
        for grade in catalog.get("grades", []):
            target = DIST / grade["download_url"].lstrip("/")
            if not target.exists() or digest(target) != grade["sha256"]:
                errors.append(f"Grade artifact missing or hash mismatch: {target}")
                continue
            try:
                with zipfile.ZipFile(target) as archive:
                    manifest = json.loads(archive.read("MANIFEST.json"))
                    if manifest.get("schema") not in {"alika-class-bundle/v1", "alika-class-bundle/v2"}:
                        errors.append(f"Grade bundle manifest schema is invalid: {target}")
                    declared = {row["path"] for row in manifest.get("packages", [])}
                    declared.update(row["path"] for row in manifest.get("audioAssets", []))
                    if set(archive.namelist()) != declared | {"MANIFEST.json"}:
                        errors.append(f"Grade bundle entries differ from manifest: {target}")
                    for package in manifest.get("packages", []):
                        actual = hashlib.sha256(archive.read(package["path"])).hexdigest()
                        if actual != package["sha256"]:
                            errors.append(f"Grade bundle member hash mismatch: {target}:{package['path']}")
                    for asset in manifest.get("audioAssets", []):
                        actual = hashlib.sha256(archive.read(asset["path"])).hexdigest()
                        if actual != asset["sha256"]:
                            errors.append(f"Grade bundle asset hash mismatch: {target}:{asset['path']}")
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

    # Tüm dillerin ana sayfası Vite ile derlenen yeni ana sayfadır.
    home_bundles = tuple((DIST / "assets").glob("index-*.js"))
    home_bundle_text = "\n".join(bundle.read_text(encoding="utf-8") for bundle in home_bundles)
    if not home_bundles or MICROSOFT_STORE_ID not in home_bundle_text or "site_home_" not in home_bundle_text:
        errors.append("Microsoft Store link is missing from the home page bundle")
    if PLAY_STORE_PACKAGE not in home_bundle_text:
        errors.append("Google Play link is missing from the home page bundle")
    if (DIST / "assets" / "screenshots").exists():
        errors.append("Obsolete mascot screenshots are still published")
    # Videolar sitede oynar: dosya, kapak ve Türkçe altyazı birlikte yayımlanır.
    for name in ("windows-ilk-kurulum", "android-ilk-kurulum", "windows-soru-coz"):
        for suffix in (".mp4", ".webp", ".tr.vtt"):
            if not (DIST / "videos" / "kurulum" / f"{name}{suffix}").exists():
                errors.append(f"Site video file is missing: {name}{suffix}")
    if "youtube.com/watch" in home_bundle_text:
        errors.append("Home page videos must play on the site, not link to YouTube")

    # Eski kitap kapaklı paylaşım görseli yayından kalktı.
    if (DIST / "og.png").exists() or not (DIST / "og.jpg").exists():
        errors.append("Share image must be og.jpg; the old og.png must not be published")
    for page in DIST.rglob("*.html"):
        if "/og.png" in page.read_text(encoding="utf-8"):
            errors.append(f"Old share image is referenced: {page}")
    if (DIST / ".vite").exists():
        errors.append("Build manifest must not be published")

    root_page = (DIST / "index.html").read_text(encoding="utf-8")
    if '<script type="application/ld+json">' not in root_page or '"SoftwareApplication"' not in root_page:
        errors.append("SoftwareApplication schema is missing from the Turkish home page")
    if "AliKa: Kısıtlamıyoruz, planlıyoruz" not in root_page:
        errors.append("Turkish home page is not pre-rendered with the campaign message")
    if "Windows satın alımı Android’i kapsamaz" not in root_page:
        errors.append("Windows-only Store purchase scope is missing from the Turkish home page")
    if re.search(r'name="robots" content="[^"]*noindex', root_page, re.I):
        errors.append("Turkish home page must not be noindex")

    forbidden = re.compile(r"(google-analytics|googletagmanager|facebook\.net|hotjar|segment\.com)", re.I)
    for page in DIST.rglob("*.html"):
        if forbidden.search(page.read_text(encoding="utf-8")):
            errors.append(f"Tracker marker in {page}")

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors))
        raise SystemExit(1)
    print(
        f"OK: {expected_pages} localized pages (9 new homes, 9 catalogues, 72 redirects), "
        f"{len(guide_pages)} Turkish guide pages, verified catalog downloads, fixed legal routes, local links and tracker fence"
    )


if __name__ == "__main__":
    main()
