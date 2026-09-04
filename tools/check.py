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
MICROSOFT_STORE_CIDS = {
    "tr": "cid=site_home_tr",
    "ja": "cid=site_home_ja",
    "ko": "cid=site_home_ko",
}
STORE_OFFER_MARKERS = {
    "ja": ('"price":"230"', '"priceCurrency":"JPY"'),
    "ko": ('"price":"2500"', '"priceCurrency":"KRW"'),
}
QUIZ_REWARD_MARKERS = {
    "tr": "Üç doğru cevap ödül ilerlemesini tamamlar ve en fazla 3 dakika ek süre kazandırır.",
    "en": "Three correct answers complete reward progress and grant up to 3 extra minutes.",
    "de": "Drei richtige Antworten schließen den Belohnungsfortschritt ab und bringen bis zu 3 zusätzliche Minuten.",
    "es": "Tres aciertos completan el progreso y conceden hasta 3 minutos extra.",
    "fr": "Trois bonnes réponses complètent la progression et accordent jusqu’à 3 minutes supplémentaires.",
    "pt": "Três respostas certas completam o progresso e concedem até 3 minutos extra.",
    "ru": "Три верных ответа завершают прогресс и дают не более 3 дополнительных минут.",
    "ja": "3問正解すると進捗が完了し、追加時間は最大3分です。",
    "ko": "세 문제를 맞히면 보상 진행이 완료되고 추가 시간은 최대 3분입니다.",
}
BOOK_LANGUAGE_PATHS = ("/en/", "/de/", "/es/", "/fr/", "/pt/", "/ru/", "/ja/", "/ko/")
GUIDE_SLUGS = (
    "windows-11-cocuk-ekran-suresi",
    "soru-cozerek-ekran-suresi-kazanma",
    "bulutsuz-ebeveyn-kontrolu",
)
PREMIUM_GAME_IDS = (
    "carkifelek",
    "bilgi-yarismasi",
    "aile-sahnesi",
    "aile-kacis",
    "robot-kodlama",
    "isik-laboratuvari",
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

    book_source = (ROOT / "src" / "book-experience.tsx").read_text(encoding="utf-8")
    try:
        game_block = book_source.split("const GAMES: GameInfo[] = [", 1)[1].split(
            "const GAME_GROUPS:", 1
        )[0]
    except IndexError:
        errors.append("Premium game catalogue source markers are missing")
    else:
        game_ids = tuple(re.findall(r"\{ id: '([^']+)'", game_block))
        if game_ids != PREMIUM_GAME_IDS:
            errors.append(f"Premium game catalogue differs: {game_ids}")
    if any(
        marker in book_source
        for marker in ("GAME_REPO_SLUGS", "GAME_AGE_PACKS", "raw.githubusercontent.com/chizyo43-debug/alika-icerik/main/games")
    ):
        errors.append("Unapproved game package downloads are exposed")
    for marker in (
        "Altı premium aile oyunu geliştiriliyor.",
        "Bugün çalışan Windows ortak ekran soru oyunu ayrıdır.",
        "İndirme kapalı",
        "İnsan onayı ve premium motor kabulü bekleniyor",
    ):
        if marker not in book_source:
            errors.append(f"Premium game truth marker is missing: {marker}")

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
                if QUIZ_REWARD_MARKERS[lang] not in guide_text:
                    errors.append(f"Exact 3-question reward copy is missing: {guide_page}")
                if 'class="demo-reward">+3</div>' not in guide_text:
                    errors.append(f"Exact +3 reward visual is missing: {guide_page}")
                if 'class="demo-reward">+5</div>' in guide_text:
                    errors.append(f"Stale +5 reward visual remains: {guide_page}")

        content_page = base / "content" / "index.html"
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

        downloads_page = base / "downloads" / "index.html"
        if downloads_page.exists():
            downloads_text = downloads_page.read_text(encoding="utf-8")
            if (
                "apps.microsoft.com" not in downloads_text
                or MICROSOFT_STORE_ID not in downloads_text
                or MICROSOFT_STORE_CIDS.get(lang, MICROSOFT_STORE_CIDS["tr"])
                not in downloads_text
            ):
                errors.append(f"Microsoft Store link is missing: {downloads_page}")
            if '"@type":"SoftwareApplication"' not in downloads_text:
                errors.append(f"SoftwareApplication schema is missing: {downloads_page}")
            for marker in STORE_OFFER_MARKERS.get(lang, ()):
                if marker not in downloads_text:
                    errors.append(f"Localized Store offer is missing ({marker}): {downloads_page}")

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
        if page.exists() and MICROSOFT_STORE_CIDS["tr"] not in page.read_text(encoding="utf-8"):
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
        content_release_tags = set((catalog.get("content_releases") or {}).values())
        if catalog.get("content_release"):
            content_release_tags.add(catalog["content_release"])
        totals = catalog.get("totals") or {}
        if totals != {
            "countries": 4,
            "gradeGroups": 31,
            "subjects": 242,
            "notes": 6572,
            "questions": 121732,
            "questionBanks": 187,
            "questionBankQuestions": 374000,
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
        if len(question_banks) != 187:
            errors.append(f"Expected 187 independent question banks, got {len(question_banks)}")
        bank_country_counts = {
            country: sum(bank.get("country_code") == country for bank in question_banks)
            for country in ("TR", "JP", "KR", "GB")
        }
        if bank_country_counts != {"TR": 8, "JP": 43, "KR": 94, "GB": 42}:
            errors.append(f"Independent question bank country coverage is incomplete: {bank_country_counts}")
        subject_bank_keys = [
            (bank.get("country_code"), bank.get("grade"), bank.get("subject_code"))
            for bank in question_banks
            if bank.get("scope") == "country-grade-subject"
        ]
        if len(subject_bank_keys) != 179 or len(set(subject_bank_keys)) != 179:
            errors.append("JP/KR/GB independent subject question bank keys are incomplete or duplicated")
        for bank in question_banks:
            expected_families = 2000 if bank.get("country_code") == "TR" else 400
            if (
                bank.get("country_code") not in {"TR", "JP", "KR", "GB"}
                or bank.get("questions") != 2000
                or bank.get("families") != expected_families
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

    book_bundles = tuple((DIST / "assets").glob("index-*.js"))
    book_bundle_text = "\n".join(bundle.read_text(encoding="utf-8") for bundle in book_bundles)
    if not book_bundles or MICROSOFT_STORE_ID not in book_bundle_text or "site_home_" not in book_bundle_text:
        errors.append("Microsoft Store link is missing from the book experience")
    if "bookLanguagePicker" not in book_bundle_text or not all(
        path in book_bundle_text for path in BOOK_LANGUAGE_PATHS
    ):
        errors.append("Language picker is missing or incomplete in the book experience")
    if "Altı premium aile oyunu geliştiriliyor." not in book_bundle_text or "İndirme kapalı" not in book_bundle_text:
        errors.append("Premium game truth copy is missing from the built book experience")
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
    if MICROSOFT_STORE_CIDS["tr"] not in root_page:
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
