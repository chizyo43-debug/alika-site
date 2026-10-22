from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse


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
    "roadmap": "plan",
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
# Sitede barındırılan kanal videoları (YouTube gömülmez; kanaldan silinen video buradan da çıkar).
SITE_VIDEOS = (
    "windows-ilk-kurulum",
    "android-ilk-kurulum",
    "ilk-gun-ayarlari",
    "windows-ebeveyn-paneli",
    "android-ebeveyn-paneli",
    "ev-agi",
    "alika-reklam",
    "alika-reklam-dikey",
    "ekran-suresinden-fazlasi",
)
GUIDE_SLUGS = (
    "windows-cocuk-ekran-suresi-nasil-yonetilir",
    "windows-11-cocuk-ekran-suresi",
    "soru-cozerek-ekran-suresi-kazanma",
    "bulutsuz-ebeveyn-kontrolu",
    "ailece-ekran-suresi-plani",
    "android-cocuk-ekran-suresi",
    "ara-tatil-ekran-suresi-plani",
    "15-yas-alti-sosyal-medya-duzenlemesi",
    "cocuga-ilk-telefon",
    "cocuga-tablet-telefon-hediye",
    "kardesler-bilgisayar-sirasi",
    "yariyil-tatili-ekran-suresi",
)
SCHOOL_KIT_PDF = "aile-ekran-plani-veli-notu.pdf"
# Sosyal medya hesapları (ana sayfa altlığı, sabit sayfaların altlığı, ana sayfa JSON-LD sameAs).
SOCIAL_IDS = ("instagram", "facebook", "x", "youtube", "linkedin")
# Tek izinli analiz kaynağı: Cloudflare Web Analytics'in çerezsiz JS işaretçisi (tools/inject-analytics.mjs).
# Belirteç src/data/analytics.json içinde; boşsa hiçbir sayfada işaretçi olmamalı.
CLOUDFLARE_BEACON_HOST = "static.cloudflareinsights.com"
PRIVACY_PAGES = ("privacy.html", "privacy/index.html", "privacy-policy.html", "gizlilik/index.html")


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


def analytics_token() -> str:
    config = json.loads((ROOT / "src" / "data" / "analytics.json").read_text(encoding="utf-8"))
    return str(config.get("cloudflareWebAnalyticsToken") or "").strip()


def beacon_tag(token: str) -> str:
    """tools/inject-analytics.mjs'in </body> öncesine yazdığı etiketin tam hâli."""
    return (
        '<!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" '
        f"data-cf-beacon='{{\"token\": \"{token}\"}}'></script><!-- End Cloudflare Web Analytics -->\n"
    )


def published_bytes(target: Path, token: str) -> bytes:
    """Yayımlanan yasal kopya; işaretçi etiketi çıkarılınca kaynakla bayt bayt aynı olmalı."""
    data = target.read_bytes()
    return data.replace(beacon_tag(token).encode("utf-8"), b"", 1) if token else data


def check_analytics(errors: list[str], token: str) -> str:
    """Analiz çiti: dış kaynaklı betik yalnız Cloudflare işaretçisi olabilir. Belirteç boşsa hiçbir sayfada
    işaretçi yok; doluysa yönlendirme dışındaki her sayfada </body> öncesinde tam bir işaretçi var ve
    gizlilik sayfaları Cloudflare Web Analytics'i anlatıyor."""
    if token and not re.fullmatch(r"[A-Za-z0-9_-]{8,128}", token):
        errors.append("analytics.json: Cloudflare Web Analytics token has an unexpected format")
        return "invalid token"
    tag = beacon_tag(token) if token else ""
    tagged = redirects = 0
    for page in sorted(DIST.rglob("*.html")):
        text = page.read_text(encoding="utf-8")
        rel = page.relative_to(DIST).as_posix()
        for src in re.findall(r"""<script\b[^>]*?\bsrc=["']([^"']+)["']""", text, re.I):
            host = urlparse(f"https:{src}" if src.startswith("//") else src).hostname
            if host and host != CLOUDFLARE_BEACON_HOST:
                errors.append(f"Third-party script from {host} in {rel}")
        markers = text.count("cloudflareinsights") + text.count("data-cf-beacon")
        redirect = 'http-equiv="refresh"' in text
        if not token or redirect:
            redirects += redirect
            if markers:
                reason = "redirect page" if token else "token is empty"
                errors.append(f"Cloudflare Web Analytics beacon must not be on {rel} ({reason})")
            continue
        if text.count(tag) != 1 or markers != 2:
            errors.append(f"Expected exactly one Cloudflare Web Analytics beacon: {rel}")
        elif text.count("</body>") != 1 or text.index(tag) + len(tag) != text.index("</body>"):
            errors.append(f"Cloudflare Web Analytics beacon must sit right before </body>: {rel}")
        else:
            tagged += 1
    if not token:
        return "Cloudflare Web Analytics off (empty token, no beacon on any page)"
    for rel in PRIVACY_PAGES:
        page = DIST / rel
        if not page.exists() or "Cloudflare Web Analytics" not in page.read_text(encoding="utf-8"):
            errors.append(f"Privacy page must mention Cloudflare Web Analytics: {rel}")
    return f"Cloudflare Web Analytics beacon on {tagged} pages, none on {redirects} redirect pages"


def check_social(errors: list[str], home_bundle_text: str) -> int:
    """Sosyal hesaplar: ana sayfa altlığı (React paketi), ana sayfa sameAs ve sabit sayfaların altlığı."""
    profiles = json.loads((ROOT / "src" / "data" / "social.json").read_text(encoding="utf-8")).get("profiles") or []
    if tuple(profile.get("id") for profile in profiles) != SOCIAL_IDS:
        errors.append(f"social.json profiles differ from {SOCIAL_IDS}")
        return 0
    urls = [profile["url"] for profile in profiles]
    for url in urls:
        # Profil bağlantıları mağaza kampanyası taşımaz.
        if urlparse(url).scheme != "https" or "cid=" in url or "utm_" in url:
            errors.append(f"Social profile URL must be a plain https link: {url}")
        if url not in home_bundle_text:
            errors.append(f"Home footer social link is missing from the bundle: {url}")
    for lang in LANGS:
        home = (DIST if lang == "tr" else DIST / lang) / "index.html"
        if not home.exists():
            continue
        match = re.search(r'<script type="application/ld\+json">(.*?)</script>', home.read_text(encoding="utf-8"), re.S)
        if not match or json.loads(match.group(1)).get("sameAs") != urls:
            errors.append(f"Home schema sameAs must list the social profiles: {home}")
    footer_pages = 0
    for page in sorted(DIST.rglob("*.html")):
        text = page.read_text(encoding="utf-8")
        if '<footer class="site-footer">' not in text:
            continue
        footer_pages += 1
        footer_html = text[text.index('<footer class="site-footer">'):]
        for url in urls:
            link = f'<a href="{html.escape(url)}" target="_blank" rel="me noopener" aria-label="'
            if footer_html.count(link) != 1 or f'{link}"' in footer_html:
                errors.append(f"Footer social link is missing, repeated or unnamed ({url}): {page.relative_to(DIST).as_posix()}")
    if footer_pages < 20:
        errors.append(f"Static footer pages unexpectedly few: {footer_pages}")
    return footer_pages


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


# site.js içindeki store-cid bloğunu sahte bir sayfada çalıştırır; bağlantıların son hâlini döndürür.
STORE_CID_HARNESS = r"""
const vm = require("node:vm");
const input = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
const result = input.cases.map(({ url, hrefs }) => {
  const links = hrefs.map((href) => ({ href, getAttribute() { return this.href; }, setAttribute(_, value) { this.href = value; } }));
  vm.runInNewContext(input.code, { window: { location: new URL(url) }, document: { querySelectorAll: () => links }, URL, URLSearchParams });
  return links.map((link) => link.href);
});
process.stdout.write(JSON.stringify(result));
"""


def anchor_hrefs(page: Path) -> list[str]:
    return [html.unescape(value) for value in re.findall(r'<a\b[^>]*?\bhref="([^"]*)"', page.read_text(encoding="utf-8"))]


def run_store_cid(cases: list[tuple[str, list[str]]]) -> list[list[str]]:
    script = (DIST / "assets" / "site.js").read_text(encoding="utf-8")
    block = re.search(r"// store-cid:start(.*?)// store-cid:end", script, re.S)
    node = shutil.which("node")
    if not block or not node:
        raise RuntimeError("store-cid block or node is missing")
    payload = json.dumps({"code": block.group(1), "cases": [{"url": url, "hrefs": hrefs} for url, hrefs in cases]})
    completed = subprocess.run([node, "-e", STORE_CID_HARNESS], input=payload, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(completed.stdout)


def check_store_cid(errors: list[str]) -> None:
    """Adresteki geçerli cid rehber düğmelerine ve okullar sayfasındaki rehber bağlantılarına geçer."""
    guide = DIST / "rehber" / "ailece-ekran-suresi-plani" / "index.html"
    school = DIST / "okullar" / "index.html"
    guide_hrefs, school_hrefs = anchor_hrefs(guide), anchor_hrefs(school)
    base = "https://www.alika.tr"
    guide_url = f"{base}/rehber/ailece-ekran-suresi-plani/"
    try:
        linkedin, other, plain, invalid, schools = run_store_cid([
            (f"{guide_url}?cid=linkedin_founder_test_tr", guide_hrefs),
            (f"{guide_url}?cid=YouTube_Profile_TR", guide_hrefs),
            (guide_url, guide_hrefs),
            (f"{guide_url}?cid=bad%26campaign", guide_hrefs),
            (f"{base}/okullar/?cid=linkedin_company_okullar", school_hrefs),
        ])
    except (RuntimeError, OSError, subprocess.CalledProcessError, ValueError) as error:
        errors.append(f"Store CID script could not be checked: {error}")
        return

    def store_values(hrefs: list[str]) -> tuple[list[str], list[dict[str, list[str]]]]:
        store = [parse_qs(urlparse(h).query)["cid"][0] for h in hrefs if h.startswith(f"https://apps.microsoft.com/detail/{MICROSOFT_STORE_ID}")]
        play = [parse_qs(parse_qs(urlparse(h).query)["referrer"][0]) for h in hrefs if h.startswith("https://play.google.com/store/apps/details")]
        return store, play

    for label, hrefs, campaign, source, medium in (
        ("LinkedIn cid", linkedin, "linkedin_founder_test_tr", "linkedin", "post"),
        ("other cid", other, "youtube_profile_tr", "site", "rehber"),
    ):
        store, play = store_values(hrefs)
        if len(store) != 1 or store[0] != campaign:
            errors.append(f"Guide Store button does not carry the {label}: {store}")
        if len(play) != 1 or play[0] != {"utm_source": [source], "utm_medium": [medium], "utm_campaign": [campaign]}:
            errors.append(f"Guide Play referrer does not carry the {label}: {play}")
    if plain != guide_hrefs or invalid != guide_hrefs:
        errors.append("Guide links change without a valid cid in the address")
    school_guides = [h for h in schools if h.startswith("/rehber/")]
    if not school_guides or any("?cid=linkedin_company_okullar" not in h for h in school_guides):
        errors.append(f"Schools page guide links do not carry the cid: {school_guides}")
    if any(".pdf?" in h for h in schools):
        errors.append("Schools page PDF link must stay unchanged")


def main() -> None:
    errors: list[str] = []
    locales = json.loads((ROOT / "src" / "data" / "locales.json").read_text(encoding="utf-8"))
    if tuple(locales) != LANGS:
        errors.append(f"Locale order/membership differs: {tuple(locales)}")

    token = analytics_token()
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
            # Açılış cümlesi ürünün ne olduğunu söyler; arama motoru da aynısını görmeli.
            if lang == "tr" and "Windows ve Android için ebeveyn kontrolü." not in home_text:
                errors.append(f"Home pitch is missing from the summary: {home_page}")
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
        "ailece-ekran-suresi-plani": ("site_rehber_ekran_plani_tr", True),
        "android-cocuk-ekran-suresi": ("site_rehber_android_tr", True),
        "ara-tatil-ekran-suresi-plani": ("site_rehber_ara_tatil_tr", True),
        "15-yas-alti-sosyal-medya-duzenlemesi": ("site_rehber_15yas_tr", True),
        "cocuga-ilk-telefon": ("site_rehber_ilk_telefon_tr", True),
        "cocuga-tablet-telefon-hediye": ("site_rehber_hediye_cihaz_tr", True),
        "kardesler-bilgisayar-sirasi": ("site_rehber_kardes_bilgisayar_tr", False),
        "yariyil-tatili-ekran-suresi": ("site_rehber_yariyil_tr", True),
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
        # Altlıktaki YouTube kanal bağlantısı video değildir (check_social denetler); yazı gövdesinde YouTube olmaz.
        guide_body = guide_text.split('<footer class="site-footer">', 1)[0]
        if "youtube.com" in guide_body or "youtu.be" in guide_body:
            errors.append(f"Guide video must play on the site, not on YouTube: {page}")

    # Okullar sayfası: dizinde ve site haritasında; veli notu PDF'i var, yazdırma sayfası noindex.
    school_page = DIST / "okullar" / "index.html"
    school_text = school_page.read_text(encoding="utf-8") if school_page.exists() else ""
    sitemap_text = (DIST / "sitemap.xml").read_text(encoding="utf-8")
    if f'href="/okullar/{SCHOOL_KIT_PDF}"' not in school_text or not (DIST / "okullar" / SCHOOL_KIT_PDF).exists():
        errors.append("Schools page or its parent-note PDF is missing")
    if "/okullar/</loc>" not in sitemap_text or "veli-notu" in sitemap_text:
        errors.append("Sitemap must list /okullar/ and leave out the printable parent note")
    kit_page = DIST / "okullar" / "veli-notu" / "index.html"
    if not kit_page.exists() or '<meta name="robots" content="noindex">' not in kit_page.read_text(encoding="utf-8"):
        errors.append("Printable parent note must exist and be noindex")
    if 'href="/okullar/"' not in (DIST / "rehber" / "index.html").read_text(encoding="utf-8"):
        errors.append("Guide hub must link the schools page")

    # İngiltere hazırlık sayfası gizli: rehbere yönlenir, dizine ve site haritasına girmez.
    uk_landing = DIST / "en" / "uk-windows-screen-time" / "index.html"
    uk_landing_text = uk_landing.read_text(encoding="utf-8") if uk_landing.exists() else ""
    if (
        '<meta name="robots" content="noindex">' not in uk_landing_text
        or 'url=/en/guides/windows-child-screen-time/"' not in uk_landing_text
    ):
        errors.append("UK preparation page must be a noindex redirect to the UK guide")
    if "uk-windows-screen-time" in (DIST / "sitemap.xml").read_text(encoding="utf-8"):
        errors.append("Hidden UK preparation page is still in the sitemap")
    uk_pages = (DIST / "en" / "guides" / "windows-child-screen-time" / "index.html",)
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

    catalog_path = DIST / "icerik" / "catalog-v2.json"
    alias_path = DIST / "icerik" / "index.html"
    if not alias_path.exists():
        errors.append("Turkish /icerik/ alias is missing")
    else:
        alias_text = alias_path.read_text(encoding="utf-8")
        for section_id in ("lgs", "ilkokul", "oyunlar"):
            if f'id="{section_id}"' not in alias_text:
                errors.append(f"Content page section is missing: #{section_id}")
    if not catalog_path.exists():
        errors.append("Content catalog JSON is missing")
    else:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        if catalog.get("schema") != "alika-content-catalog/v2":
            errors.append("Content catalog schema is invalid")
        if not catalog.get("grades") or not catalog.get("subjects"):
            errors.append("Content catalog is empty")
        totals = catalog.get("totals") or {}
        # alika-icerik a41e183: 100 ders + 6 LGS paketi, 1 ilkokul görsel paketi, 2 oyun × 9 dil × 4 yaş grubu.
        expected_totals = {
            "countries": 1,
            "gradeGroups": 4,
            "subjects": 28,
            "lessonPackages": 100,
            "lgsPackages": 6,
            "primaryPackages": 1,
            "primaryQuestions": 600,
            "games": 2,
            "gamePackages": 72,
        }
        unexpected = {key: totals.get(key) for key, value in expected_totals.items() if totals.get(key) != value}
        if unexpected:
            errors.append(f"Content catalog totals are unexpected: {unexpected}")
        # Yalnız Türkiye ortaokul (5–8) ders kapsamı yayımlanır; diğer sınıflar ve ülkeler plan aşamasında.
        if catalog.get("published_scope") != {"turkiye": [5, 6, 7, 8]}:
            errors.append(f"Published content scope must be Türkiye 5–8: {catalog.get('published_scope')}")
        for kind in ("grades", "subjects"):
            for row in catalog.get(kind, []):
                if row.get("country_slug") != "turkiye" or row.get("grade") not in {5, 6, 7, 8}:
                    errors.append(f"Unpublished scope leaked into {kind}: {row.get('country_slug')} {row.get('grade')}")

        def served_file(row: dict, label: str) -> Path | None:
            """İndirilen her dosya sitede /icerik/ altında durmalı ve katalogdaki sha256 ile eşleşmeli."""
            url = row.get("download_url", "")
            if urlparse(url).scheme or not url.startswith("/icerik/"):
                errors.append(f"{label} must be served from /icerik/: {url}")
                return None
            target = DIST / url.lstrip("/")
            if not target.exists() or digest(target) != row.get("sha256"):
                errors.append(f"{label} missing or hash mismatch: {target}")
                return None
            return target

        lgs = catalog.get("lgs") or {}
        bundles = [("Grade", row) for row in catalog.get("grades", [])]
        bundles += [("Subject", row) for row in catalog.get("subjects", [])]
        if lgs.get("download_url"):
            bundles.append(("LGS", lgs))
        else:
            errors.append("LGS bundle is missing")
        for label, row in bundles:
            target = served_file(row, f"{label} bundle")
            if target is None:
                continue
            try:
                with zipfile.ZipFile(target) as archive:
                    manifest = json.loads(archive.read("MANIFEST.json"))
                    if manifest.get("schema") != "alika-class-bundle/v1":
                        errors.append(f"{label} bundle manifest schema is invalid: {target}")
                    declared = {package["path"] for package in manifest.get("packages", [])}
                    if set(archive.namelist()) != declared | {"MANIFEST.json"}:
                        errors.append(f"{label} bundle entries differ from manifest: {target}")
                    for package in manifest.get("packages", []):
                        actual = hashlib.sha256(archive.read(package["path"])).hexdigest()
                        if actual != package["sha256"]:
                            errors.append(f"{label} bundle member hash mismatch: {target}:{package['path']}")
            except (KeyError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
                errors.append(f"{label} bundle is invalid: {target}: {exc}")

        # Tek tek indirilen ders/LGS/ilkokul paketleri: insan incelemesi iddia edilmez.
        packages = [package for subject in catalog.get("subjects", []) for package in subject.get("packages", [])]
        packages += lgs.get("packages", [])
        packages += catalog.get("primary", [])
        for package in packages:
            served_file(package, "Content package")
            if package.get("human_reviewed") is not False:
                errors.append(f"Content package must not claim human review: {package.get('filename')}")
        if any(package.get("kind") != "lgs" for package in lgs.get("packages", [])):
            errors.append("LGS section contains a non-LGS package")
        for game in catalog.get("games", []):
            if not (DIST / game.get("art_url", "").lstrip("/")).exists():
                errors.append(f"Game art is missing: {game.get('slug')}")
            if game.get("human_reviewed") is not False:
                errors.append(f"Game content must not claim human review: {game.get('slug')}")
            for package in game.get("packages", []):
                served_file(package, "Game package")

    for name in ("privacy", "eula"):
        source = ROOT / "legal" / f"{name}.html"
        for target in (DIST / f"{name}.html", DIST / name / "index.html"):
            if not target.exists() or published_bytes(target, token) != source.read_bytes():
                errors.append(f"Legal file changed or missing: {target}")

    # Türkçe yasal metinler: kaynakla aynı, İngilizce sürüme bağlı.
    for name, english in (("gizlilik", "privacy"), ("kullanim-kosullari", "eula")):
        target = DIST / name / "index.html"
        source = ROOT / "legal" / "tr" / f"{name}.html"
        if not target.exists() or published_bytes(target, token) != source.read_bytes():
            errors.append(f"Turkish legal page changed or missing: {target}")
        elif f'href="/{english}/"' not in target.read_text(encoding="utf-8"):
            errors.append(f"Turkish legal page must link its English version: {target}")
    if 'href="/gizlilik/"' not in (DIST / "content" / "index.html").read_text(encoding="utf-8"):
        errors.append("Turkish pages must link the Turkish privacy policy")

    if published_bytes(DIST / "privacy-policy.html", token) != (ROOT / "legal" / "privacy.html").read_bytes():
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
    for name in SITE_VIDEOS:
        for suffix in (".mp4", ".webp", ".tr.vtt"):
            if not (DIST / "videos" / "kurulum" / f"{name}{suffix}").exists():
                errors.append(f"Site video file is missing: {name}{suffix}")
    if "youtube.com/watch" in home_bundle_text:
        errors.append("Home page videos must play on the site, not link to YouTube")
    # Destek adresi destek@alika.tr. Eski Gmail adresi yalnız gizlilik metninde, uygulamaların hata raporu
    # düğmesinin bugünkü hedefi olarak geçer.
    if "destek@alika.tr" not in home_bundle_text or "alika.destek@gmail.com" in home_bundle_text:
        errors.append("Home page must use the support address destek@alika.tr")
    for page in DIST.rglob("*.html"):
        legal_copy = any(name in page.relative_to(DIST).as_posix() for name in ("privacy", "gizlilik"))
        if "alika.destek@gmail.com" in page.read_text(encoding="utf-8") and not legal_copy:
            errors.append(f"Old support address on {page.relative_to(DIST).as_posix()}")

    # Kanaldan silinen soru-çöz videosu sitede kalmamalı.
    if (DIST / "videos" / "kurulum" / "windows-soru-coz.mp4").exists() or "/videos/kurulum/windows-soru-coz" in home_bundle_text:
        errors.append("The deleted soru-coz video must not be published")
    for page in (DIST / "rehber").rglob("index.html"):
        for name in re.findall(r'/videos/kurulum/([a-z0-9-]+)\.mp4', page.read_text(encoding="utf-8")):
            if name not in SITE_VIDEOS:
                errors.append(f"Guide links an unknown video: {page.parent.name} -> {name}")

    # Eski kitap kapaklı paylaşım görseli yayından kalktı.
    if (DIST / "og.png").exists() or not (DIST / "og.jpg").exists():
        errors.append("Share image must be og.jpg; the old og.png must not be published")
    for page in DIST.rglob("*.html"):
        page_text = page.read_text(encoding="utf-8")
        if "/og.png" in page_text:
            errors.append(f"Old share image is referenced: {page}")
        # Site asistanı kaldırıldı; hiçbir sayfa onu yüklememeli.
        if "site-assistant" in page_text:
            errors.append(f"Removed site assistant is still loaded: {page}")
    if any(DIST.rglob("site-assistant*")):
        errors.append("Removed site assistant files are still published")
    if (DIST / ".vite").exists():
        errors.append("Build manifest must not be published")

    # Bilinmeyen adreste sitenin kendi 404 sayfası; dizine girmez.
    not_found = DIST / "404.html"
    if not not_found.exists() or '<meta name="robots" content="noindex">' not in not_found.read_text(encoding="utf-8"):
        errors.append("404.html is missing or indexable")
    # Alt sayfaların menüsü yeni ana sayfayla aynı: deneme düğmesi #deneme, eski bölüm adları yok.
    for page in (DIST / "content" / "index.html", DIST / "rehber" / "index.html", DIST / "en" / "content" / "index.html"):
        static_text = page.read_text(encoding="utf-8")
        if 'href="/#deneme"' not in static_text and 'href="/en/#deneme"' not in static_text:
            errors.append(f"Static header trial button must go to #deneme: {page}")
        if "/how-it-works/" in static_text or "/ecosystem/" in static_text or "/downloads/" in static_text:
            errors.append(f"Static page still links to old subpages: {page}")
    for page in DIST.rglob("*.html"):
        visible = page.read_text(encoding="utf-8")
        if "Codex" in visible:
            errors.append(f"Internal tool name is shown: {page}")
        if page.parts[len(DIST.parts)] == "rehber" and "₺" in visible:
            errors.append(f"Guide states a price; the stores show it: {page}")

    root_page = (DIST / "index.html").read_text(encoding="utf-8")
    if '<script type="application/ld+json">' not in root_page or '"SoftwareApplication"' not in root_page:
        errors.append("SoftwareApplication schema is missing from the Turkish home page")
    if "AliKa: Kısıtlamıyoruz, planlıyoruz" not in root_page:
        errors.append("Turkish home page is not pre-rendered with the campaign message")
    if "Windows satın alımı Android’i kapsamaz" not in root_page:
        errors.append("Windows-only Store purchase scope is missing from the Turkish home page")
    if re.search(r'name="robots" content="[^"]*noindex', root_page, re.I):
        errors.append("Turkish home page must not be noindex")

    check_store_cid(errors)
    social_footer_pages = check_social(errors, home_bundle_text)

    forbidden = re.compile(r"(google-analytics|googletagmanager|facebook\.net|hotjar|segment\.com)", re.I)
    for page in (*DIST.rglob("*.html"), *(DIST / "assets").glob("*.js")):
        if forbidden.search(page.read_text(encoding="utf-8")):
            errors.append(f"Tracker marker in {page}")
    analytics_summary = check_analytics(errors, token)

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors))
        raise SystemExit(1)
    print(
        f"OK: {expected_pages} localized pages (9 new homes, 9 catalogues, 72 redirects), "
        f"{len(guide_pages)} Turkish guide pages, verified catalog downloads, fixed legal routes, local links and tracker fence"
    )
    print(f"OK: social links in 9 home footers + schema sameAs and {social_footer_pages} static page footers; {analytics_summary}")


if __name__ == "__main__":
    main()
