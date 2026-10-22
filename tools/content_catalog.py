from __future__ import annotations

import hashlib
import json
import re
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path


COUNTRY_NAMES = {"turkiye": "Türkiye"}
# Sitede yalnız çalışma verisi hazır olan ders kapsamı yayımlanır: Türkiye ortaokul (5–8).
# İlkokul görsel etkinlikleri ve oyun paketleri ders kapsamı değildir; ayrı bölümlerde sunulur.
PUBLISHED_GRADES = {"turkiye": frozenset({5, 6, 7, 8})}
# LGS deneme paketi ders paketlerinden ayrıdır (başlıkta assessment.kind: lgs-deneme).
LGS_FOLDER = "lgs-2027"
# Ders kartlarının sırası; listede olmayan ders sona, adına göre gelir.
SUBJECT_ORDER = (
    "turkce", "matematik", "fen-bilimleri", "sosyal-bilgiler", "inkilap-tarihi", "ingilizce",
    "din-kulturu-ve-ahlak-bilgisi", "din-kulturu", "bilisim-teknolojileri", "teknoloji-ve-tasarim",
)
GAME_SLUGS = ("word-wheel", "name-city")
GAME_LANGS = ("tr", "en", "de", "es", "fr", "pt", "ru", "ja", "ko")
GAME_PATH = re.compile(r"^games/(?P<slug>[a-z0-9-]+)/dist/(?P<lang>[a-z]{2})/(?P<band>[a-z]+)\.alika-game$")
# Uygulama sürüm gereksinimleri (içerik deposu README'si): AMI/şekil ve LGS deneme Android 0.3.11 /
# Windows 1.2.12 ister; ilkokul visualChoice v3 kartlarını yayımlanmış Android sürümü henüz çizemez.
REQUIREMENTS = {
    "lessons": {"windows": "1.2.12", "android": "0.3.11"},
    "lgs": {"windows": "1.2.12", "android": "0.3.11"},
    "primary": {"windows": "1.2.12", "android": None},
    "games": {"windows": "1.2.12", "android_tv": "in-app"},
}
FIXED_ZIP_TIME = (2026, 9, 1, 0, 0, 0)


def _published(country_slug: str, grade: object) -> bool:
    return grade in PUBLISHED_GRADES.get(country_slug, frozenset())


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def _read_package(path: Path) -> dict:
    notes = questions = 0
    pack: dict | None = None
    with path.open("r", encoding="utf-8-sig") as handle:
        for raw in handle:
            if not raw.strip():
                continue
            row = json.loads(raw)
            kind = row.get("type")
            if kind == "pack" and pack is None:
                pack = row
            elif kind == "note":
                notes += 1
            elif kind == "question":
                questions += 1
    if not pack:
        raise ValueError(f"Paket satırı yok: {path}")
    return {"pack": pack, "notes": notes, "questions": questions}


def _copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def _package_label(theme: str, grade: int, subject: str) -> str:
    """'8. Sınıf Matematik — 1. Dönem — Üslü İfadeler' → '1. Dönem — Üslü İfadeler'."""
    prefix = f"{grade}. Sınıf {subject} — "
    return theme[len(prefix):] if theme.startswith(prefix) else theme


def _katalog_packages(content_root: Path, data_output: Path) -> list[dict]:
    """KATALOG.json'daki ders ve LGS paketlerini hash ve sayım denetimiyle okur, siteye kopyalar."""
    katalog = json.loads((content_root / "KATALOG.json").read_text(encoding="utf-8"))
    rows: list[dict] = []
    for entry in katalog["paketler"]:
        source = content_root / entry["yol"]
        rel = Path(entry["yol"])
        country_slug, grade_slug, folder, filename = rel.parts
        if _sha256(source) != entry["sha256"]:
            raise ValueError(f"Paket hash'i KATALOG.json ile eşleşmiyor: {rel}")
        parsed = _read_package(source)
        pack = parsed["pack"]
        if parsed["questions"] != entry["soru"] or parsed["notes"] != entry["not"]:
            raise ValueError(f"Paket sayımları KATALOG.json ile eşleşmiyor: {rel}")
        if pack.get("publishBlocked") is True or pack.get("publishReady") is not True:
            raise ValueError(f"Paket yayıma hazır değil: {rel}")
        if pack.get("humanReviewed") is not False or entry["reviewStatus"] != "ai-verified":
            raise ValueError(f"Paket inceleme beyanı beklenmiyor: {rel}")
        grade = int(entry["sinif"])
        is_lgs = folder == LGS_FOLDER
        if is_lgs and (pack.get("assessment") or {}).get("kind") != "lgs-deneme":
            raise ValueError(f"LGS paketi deneme olarak işaretli değil: {rel}")
        if not _published(country_slug, grade):
            continue
        _copy(source, data_output / rel)
        subject = entry["ders"]
        rows.append({
            "country_slug": country_slug,
            "country": COUNTRY_NAMES[country_slug],
            "country_code": str(pack.get("country") or "TR").upper(),
            "grade_slug": grade_slug,
            "grade": grade,
            "kind": "lgs" if is_lgs else "lesson",
            "subject_slug": folder,
            "subject": subject,
            "package_id": entry["paketId"],
            "title": subject if is_lgs else _package_label(str(pack.get("theme") or filename), grade, subject),
            "filename": filename,
            "download_url": f"/icerik/veri/{rel.as_posix()}",
            "sha256": entry["sha256"],
            "size_bytes": source.stat().st_size,
            "notes": parsed["notes"],
            "questions": parsed["questions"],
            "schema_version": entry["schemaVersion"],
            "package_version": str(pack.get("version") or "1"),
            "curriculum": entry["curriculum"],
            "review_status": entry["reviewStatus"],
            "human_reviewed": False,
            "license": str(pack.get("license") or ""),
            "source_path": source,
        })
    return rows


def _primary_packages(content_root: Path, data_output: Path) -> list[dict]:
    """İlkokul görsel etkinlik paketleri: dilden bağımsız, Question/Note sözleşmesi dışında."""
    katalog = json.loads((content_root / "KATALOG.json").read_text(encoding="utf-8"))
    rows: list[dict] = []
    for entry in katalog.get("ilkokul") or []:
        source = content_root / entry["yol"]
        rel = Path(entry["yol"])
        if _sha256(source) != entry["sha256"]:
            raise ValueError(f"İlkokul paketi hash'i KATALOG.json ile eşleşmiyor: {rel}")
        parsed = _read_package(source)
        if parsed["questions"] != entry["soru"]:
            raise ValueError(f"İlkokul paketi soru sayısı KATALOG.json ile eşleşmiyor: {rel}")
        _copy(source, data_output / rel)
        age_min, age_max = entry["yas"]
        rows.append({
            "package_id": entry["paketId"],
            "kind": entry["tur"],
            "age_min": age_min,
            "age_max": age_max,
            "language": entry["lang"],
            "filename": rel.name,
            "download_url": f"/icerik/veri/{rel.as_posix()}",
            "sha256": entry["sha256"],
            "size_bytes": source.stat().st_size,
            "questions": parsed["questions"],
            "review_status": entry["reviewStatus"],
            "human_reviewed": False,
            "child_tested": False,
        })
    return rows


def _games(content_root: Path, output: Path) -> list[dict]:
    """Ortak ekran oyun paketleri (.alika-game): dil × yaş bandı, hash ve boyut denetimli."""
    games: list[dict] = []
    for slug in GAME_SLUGS:
        catalog = json.loads((content_root / "games" / slug / "catalog.json").read_text(encoding="utf-8"))
        if catalog.get("schema_version") != 1:
            raise ValueError(f"Oyun kataloğu şeması desteklenmiyor: {slug}")
        packages: list[dict] = []
        for entry in catalog["games"]:
            match = GAME_PATH.fullmatch(entry["path"])
            if not match or match["slug"] != slug or match["lang"] != entry["language"]:
                raise ValueError(f"Oyun paketi yolu geçersiz: {entry['path']}")
            source = content_root / entry["path"]
            if source.stat().st_size != entry["size_bytes"] or _sha256(source) != entry["sha256"]:
                raise ValueError(f"Oyun paketi hash/boyut uyuşmazlığı: {entry['path']}")
            rel = Path(slug) / match["lang"] / source.name
            _copy(source, output / "oyunlar" / rel)
            packages.append({
                "game_id": entry["game_id"],
                "language": entry["language"],
                "band": match["band"],
                "age_min": entry["age_min"],
                "age_max": entry["age_max"],
                "name": entry["name"],
                "title": entry["name"].split(" · ")[0],
                "items": entry.get("word_count") or entry.get("round_count") or 0,
                "filename": f"{slug}-{match['lang']}-{source.name}",
                "download_url": f"/icerik/oyunlar/{rel.as_posix()}",
                "sha256": entry["sha256"],
                "size_bytes": entry["size_bytes"],
            })
        langs = {row["language"] for row in packages}
        if langs != set(GAME_LANGS):
            raise ValueError(f"Oyun paketleri dokuz dili kapsamıyor: {slug} {sorted(langs)}")
        packages.sort(key=lambda row: (GAME_LANGS.index(row["language"]), row["age_min"]))
        art = content_root / "games" / "visuals" / slug / "game_art.webp"
        art_url = ""
        if art.is_file():
            _copy(art, output / "oyunlar" / slug / art.name)
            art_url = f"/icerik/oyunlar/{slug}/{art.name}"
        games.append({
            "slug": slug,
            "item_kind": "words" if slug == "word-wheel" else "rounds",
            "art_url": art_url,
            "review_status": str(catalog.get("review_status") or ""),
            "human_reviewed": catalog.get("human_approved") is True,
            "packages": packages,
        })
    return games


def _write_member(archive: zipfile.ZipFile, name: str, data: bytes) -> None:
    info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)


def _write_bundle(zip_path: Path, rows: list[dict]) -> dict:
    """Uygulamanın 'İçerik ekle' akışının okuduğu alika-class-bundle/v1 ZIP'i yazar."""
    packages = [{
        "path": f"{row['subject_slug']}/{row['filename']}",
        **{key: row[key] for key in (
            "subject", "subject_slug", "filename", "sha256", "notes", "questions",
            "review_status", "human_reviewed", "license",
        )},
    } for row in rows]
    manifest = {
        "schema": "alika-class-bundle/v1",
        "country": rows[0]["country"],
        "country_code": rows[0]["country_code"],
        "grade": rows[0]["grade"],
        "publishable": True,
        "packages": packages,
    }
    with zipfile.ZipFile(zip_path, "w") as archive:
        _write_member(archive, "MANIFEST.json", json.dumps(manifest, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
        for package, row in sorted(zip(packages, rows), key=lambda item: item[0]["path"]):
            _write_member(archive, package["path"], row["source_path"].read_bytes())
    return {
        "download_url": f"/icerik/paketler/{zip_path.name}",
        "sha256": _sha256(zip_path),
        "size_bytes": zip_path.stat().st_size,
    }


def _subject_sort_key(row: dict) -> tuple[int, str]:
    slug = row["subject_slug"]
    return (SUBJECT_ORDER.index(slug) if slug in SUBJECT_ORDER else len(SUBJECT_ORDER), row["subject"])


def _public(row: dict) -> dict:
    return {key: value for key, value in row.items() if key != "source_path"}


def build_content_catalog(content_root: Path, dist: Path) -> dict:
    """Doğrulanmış içerik deposundan site kataloğu, sınıf/ders/LGS ZIP'leri ve oyun dosyaları üretir."""
    if not (content_root / "KATALOG.json").is_file():
        raise FileNotFoundError(
            "AliKa içerik deposu bulunamadı. ALIKA_CONTENT_ROOT ayarlayın veya _content yoluna checkout yapın."
        )
    output = dist / "icerik"
    data_output = output / "veri"
    bundle_output = output / "paketler"
    data_output.mkdir(parents=True, exist_ok=True)
    bundle_output.mkdir(parents=True, exist_ok=True)

    packages = _katalog_packages(content_root, data_output)
    lessons = [row for row in packages if row["kind"] == "lesson"]
    lgs = [row for row in packages if row["kind"] == "lgs"]

    by_subject: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for row in lessons:
        by_subject[(row["country_slug"], row["grade_slug"], row["subject_slug"])].append(row)
    subjects: list[dict] = []
    for (country_slug, grade_slug, subject_slug), rows in by_subject.items():
        rows.sort(key=lambda row: row["filename"])
        bundle = _write_bundle(bundle_output / f"{country_slug}-{grade_slug}-{subject_slug}.zip", rows)
        subjects.append({
            "country_slug": country_slug,
            "country": rows[0]["country"],
            "country_code": rows[0]["country_code"],
            "grade_slug": grade_slug,
            "grade": rows[0]["grade"],
            "subject_slug": subject_slug,
            "subject": rows[0]["subject"],
            "notes": sum(row["notes"] for row in rows),
            "questions": sum(row["questions"] for row in rows),
            **bundle,
            "packages": [_public(row) for row in rows],
            "_rows": rows,
        })
    subjects.sort(key=lambda row: (row["grade"], *_subject_sort_key(row)))

    by_grade: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for subject in subjects:
        by_grade[(subject["country_slug"], subject["grade_slug"])].append(subject)
    grades: list[dict] = []
    for (country_slug, grade_slug), rows in sorted(by_grade.items(), key=lambda item: item[1][0]["grade"]):
        bundle = _write_bundle(
            bundle_output / f"{country_slug}-{grade_slug}-tum-dersler.zip",
            [package for subject in rows for package in subject["_rows"]],
        )
        grades.append({
            "country_slug": country_slug,
            "country": rows[0]["country"],
            "country_code": rows[0]["country_code"],
            "grade_slug": grade_slug,
            "grade": rows[0]["grade"],
            "subject_count": len(rows),
            "package_count": sum(len(subject["packages"]) for subject in rows),
            "notes": sum(subject["notes"] for subject in rows),
            "questions": sum(subject["questions"] for subject in rows),
            **bundle,
        })
    for subject in subjects:
        del subject["_rows"]

    # LGS paketleri tek klasörde; ders sırası dosya adındaki ders adından (lgs-2027-<ders>.jsonl) gelir.
    lgs.sort(key=lambda row: _subject_sort_key(
        {**row, "subject_slug": row["filename"].removesuffix(".jsonl").removeprefix(f"{LGS_FOLDER}-")}
    ))
    lgs_section = {
        "title": "LGS 2027 deneme",
        "grade": 8,
        "packages": [_public(row) for row in lgs],
        "questions": sum(row["questions"] for row in lgs),
        "notes": sum(row["notes"] for row in lgs),
        **(_write_bundle(bundle_output / "turkiye-8-sinif-lgs-2027.zip", lgs) if lgs else {}),
    }
    primary = _primary_packages(content_root, data_output)
    games = _games(content_root, output)

    catalog = {
        "schema": "alika-content-catalog/v2",
        "published_scope": {country: sorted(grades_set) for country, grades_set in PUBLISHED_GRADES.items()},
        "requirements": REQUIREMENTS,
        "grades": grades,
        "subjects": subjects,
        "lgs": lgs_section,
        "primary": primary,
        "games": games,
        "totals": {
            "countries": len({row["country_slug"] for row in grades}),
            "gradeGroups": len(grades),
            "subjects": len(subjects),
            "lessonPackages": len(lessons),
            "notes": sum(row["notes"] for row in lessons),
            "questions": sum(row["questions"] for row in lessons),
            "lgsPackages": len(lgs),
            "lgsQuestions": lgs_section["questions"],
            "primaryPackages": len(primary),
            "primaryQuestions": sum(row["questions"] for row in primary),
            "games": len(games),
            "gamePackages": sum(len(game["packages"]) for game in games),
        },
    }
    (output / "catalog-v2.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return catalog
