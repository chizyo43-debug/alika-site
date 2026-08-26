from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path


COUNTRY_NAMES = {"turkiye": "Türkiye"}


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _read_package(path: Path) -> dict:
    notes = questions = 0
    pack: dict | None = None
    with path.open("r", encoding="utf-8-sig") as handle:
        for line_number, raw in enumerate(handle, 1):
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
    if pack.get("publishBlocked") is True:
        raise ValueError(f"Yayını engelli paket: {path}")
    return {"pack": pack, "notes": notes, "questions": questions}


def build_content_catalog(content_root: Path, dist: Path) -> dict:
    """GitHub içerik ağacından site kataloğu, ders kopyaları ve sınıf ZIP'leri üretir."""
    if not content_root.is_dir():
        raise FileNotFoundError(
            "AliKa içerik deposu bulunamadı. ALIKA_CONTENT_ROOT ayarlayın veya _content yoluna checkout yapın."
        )
    output = dist / "icerik"
    data_output = output / "veri"
    bundle_output = output / "paketler"
    data_output.mkdir(parents=True, exist_ok=True)
    bundle_output.mkdir(parents=True, exist_ok=True)

    subjects: list[dict] = []
    # Yalnız yayınlanan ülke köklerini tara. ``staging/`` ve ``reports/``
    # çalışma alanları aynı dört-seviyeli dizilimi içerebilir; bunları kataloğa
    # almak Pages dağıtımını taslak/boş bir JSONL yüzünden kırar.
    for country_slug in sorted(COUNTRY_NAMES):
        country_root = content_root / country_slug
        for source in sorted(country_root.glob("*/*/*.jsonl")):
            rel = source.relative_to(content_root)
            _, grade_slug, subject_slug, filename = rel.parts
            if subject_slug == "soru-bankasi":
                continue
            parsed = _read_package(source)
            pack = parsed["pack"]
            grade = int(pack.get("grade") or grade_slug.split("-")[0])
            target = data_output / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            subjects.append({
                "country_slug": country_slug,
                "country": COUNTRY_NAMES[country_slug],
                "country_code": str(pack.get("country") or "").upper(),
                "grade_slug": grade_slug,
                "grade": grade,
                "subject_slug": subject_slug,
                "subject": str(pack.get("subject") or subject_slug.replace("-", " ").title()),
                "filename": filename,
                "download_url": f"/icerik/veri/{rel.as_posix()}",
                "sha256": _sha256(source),
                "size_bytes": source.stat().st_size,
                "notes": parsed["notes"],
                "questions": parsed["questions"],
                "schema_version": str(pack.get("schemaVersion") or ""),
                # İçerik sözleşmesi hem eski sayısal sürümleri hem SemVer
                # (ör. ``5.0.0``) kabul eder. Katalogda kayıpsız metin tut.
                "package_version": str(pack.get("version") or "1"),
                "review_status": str(pack.get("reviewStatus") or "unreviewed"),
                "human_reviewed": bool(pack.get("humanReviewed", False)),
                "license": str(pack.get("license") or ""),
            })

    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for subject in subjects:
        grouped[(subject["country_slug"], subject["grade_slug"])].append(subject)

    grades: list[dict] = []
    for (country_slug, grade_slug), rows in sorted(grouped.items()):
        zip_name = f"{country_slug}-{grade_slug}-tum-dersler.zip"
        zip_path = bundle_output / zip_name
        manifest = {
            "schema": "alika-class-bundle/v1",
            "country": rows[0]["country"],
            "country_code": rows[0]["country_code"],
            "grade": rows[0]["grade"],
            "source_repository": "https://github.com/chizyo43-debug/alika-icerik",
            "quality_disclosure": "Makine doğrulamalı içerik; insan incelemesi tamamlanmadı.",
            "packages": [
                {
                    "path": f"{row['subject_slug']}/{row['filename']}",
                    **{key: row[key] for key in (
                        "subject", "subject_slug", "filename", "sha256", "notes", "questions",
                        "review_status", "human_reviewed", "license",
                    )},
                }
                for row in rows
            ],
        }
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr(
                "MANIFEST.json",
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            )
            for row in rows:
                source = content_root / row["country_slug"] / row["grade_slug"] / row["subject_slug"] / row["filename"]
                archive.write(source, f"{row['subject_slug']}/{row['filename']}")
        grades.append({
            "country_slug": country_slug,
            "country": rows[0]["country"],
            "country_code": rows[0]["country_code"],
            "grade_slug": grade_slug,
            "grade": rows[0]["grade"],
            "subject_count": len(rows),
            "notes": sum(row["notes"] for row in rows),
            "questions": sum(row["questions"] for row in rows),
            "download_url": f"/icerik/paketler/{zip_name}",
            "sha256": _sha256(zip_path),
            "size_bytes": zip_path.stat().st_size,
        })

    catalog = {
        "schema": "alika-content-catalog/v1",
        "source_repository": "https://github.com/chizyo43-debug/alika-icerik",
        "quality_disclosure": "Makine doğrulamalı içerik; insan incelemesi tamamlanmadı.",
        "grades": grades,
        "subjects": subjects,
    }
    (output / "catalog-v1.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return catalog
