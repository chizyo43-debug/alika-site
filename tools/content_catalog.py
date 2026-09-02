from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path


COUNTRY_NAMES = {"turkiye": "Türkiye", "JP": "Japonya", "KR": "Kore"}
COUNTRY_SLUGS = {"JP": "japonya", "KR": "kore"}
CONTENT_RELEASE_TAG = "question-banks-2026.09.01"
COUNTRY_ORDER = {"turkiye": 0, "japonya": 1, "kore": 2}


def _grade_group_sort_key(item: tuple[tuple[str, str], list[dict]]) -> tuple[int, float, str]:
    (country_slug, grade_slug), rows = item
    grade = rows[0]["grade"]
    grade_order = float(grade) if isinstance(grade, int) else 11.5
    return COUNTRY_ORDER.get(country_slug, 99), grade_order, grade_slug
CONTENT_RELEASE_URL = (
    "https://github.com/chizyo43-debug/alika-icerik/releases/download/"
    f"{CONTENT_RELEASE_TAG}"
)
FIXED_ZIP_TIME = (2026, 9, 1, 0, 0, 0)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


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
    return {
        "pack": pack,
        "notes": notes,
        "questions": questions,
        "publish_blocked": pack.get("publishBlocked") is True,
    }


def _release_subjects(content_root: Path) -> list[dict]:
    subjects: list[dict] = []
    pointer_root = content_root / "library" / "curriculum"
    for country_code in ("JP", "KR"):
        pointer_path = pointer_root / country_code / "current-publish-release.json"
        if not pointer_path.is_file():
            continue
        pointer = json.loads(pointer_path.read_text(encoding="utf-8"))
        if pointer.get("publishable") is not True or pointer.get("releaseBlockers") != []:
            raise ValueError(f"Yayımlanamaz ülke işaretçisi: {pointer_path}")
        catalog_path = content_root / pointer["catalogPath"]
        audit_path = content_root / pointer["auditPath"]
        if _sha256(catalog_path) != pointer["catalogSha256"]:
            raise ValueError(f"Ülke kataloğu hash uyuşmazlığı: {catalog_path}")
        if _sha256(audit_path) != pointer["auditSha256"]:
            raise ValueError(f"Ülke denetimi hash uyuşmazlığı: {audit_path}")
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
        if (
            catalog.get("publishable") is not True
            or catalog.get("releaseBlockers") != []
            or audit.get("publishable") is not True
            or audit.get("status") != "passed"
            or audit.get("errors") != []
            or audit.get("catalogSha256") != pointer["catalogSha256"]
        ):
            raise ValueError(f"Ülke release kapısı geçmedi: {country_code}")

        for entry in catalog.get("packages", []):
            bundle = content_root / entry["bundlePath"]
            if not bundle.is_file():
                raise FileNotFoundError(bundle)
            if bundle.stat().st_size != entry["bundleBytes"] or _sha256(bundle) != entry["bundleSha256"]:
                raise ValueError(f"Ders ZIP hash/boyut uyuşmazlığı: {bundle}")
            if entry.get("publicationStatus") != "publishable-produced-safe-scope" or entry.get("releaseBlockers") != []:
                raise ValueError(f"Ders ZIP yayımlanabilir değil: {bundle}")
            with zipfile.ZipFile(bundle) as archive:
                manifest = json.loads(archive.read("MANIFEST.json"))
                if manifest.get("publishable") is not True or manifest.get("releaseId") != catalog["releaseId"]:
                    raise ValueError(f"Ders manifesti release ile eşleşmiyor: {bundle}")
                package = manifest["packages"][0]
                payload = archive.read(package["path"])
                if _sha256_bytes(payload) != package["sha256"]:
                    raise ValueError(f"Ders JSONL hash uyuşmazlığı: {bundle}")
                rows = [json.loads(line) for line in payload.decode("utf-8").splitlines()]
                header = rows[0]
                notes = sum(row.get("type") == "note" for row in rows[1:])
                questions = sum(row.get("type") == "question" for row in rows[1:])
                if header.get("publishable") is not True or header.get("schemaVersion") != "2.3":
                    raise ValueError(f"Ders paketi sözleşme kapısını geçmedi: {bundle}")
                if notes != entry["counts"]["notes"] or questions != entry["counts"]["questions"]:
                    raise ValueError(f"Ders sayımları katalogla eşleşmiyor: {bundle}")
                for asset in manifest.get("audioAssets") or []:
                    if _sha256_bytes(archive.read(asset["path"])) != asset["sha256"]:
                        raise ValueError(f"Ses varlığı hash uyuşmazlığı: {bundle}:{asset['path']}")

            grade = entry["grade"]
            grade_slug = f"{grade}-sinif" if isinstance(grade, int) else "11-12-sinif-secmeli"
            country_slug = COUNTRY_SLUGS[country_code]
            subjects.append({
                "country_slug": country_slug,
                "country": COUNTRY_NAMES[country_code],
                "country_code": country_code,
                "grade_slug": grade_slug,
                "grade": grade,
                "subject_slug": entry["subjectCode"],
                "subject": entry["subject"],
                "filename": bundle.name,
                "download_url": f"{CONTENT_RELEASE_URL}/{bundle.name}",
                "sha256": entry["bundleSha256"],
                "size_bytes": entry["bundleBytes"],
                "notes": notes,
                "questions": questions,
                "schema_version": "2.3",
                "package_version": catalog["releaseId"],
                "review_status": "passed-critical-codex-self-audit",
                "human_reviewed": False,
                "license": "AliKa özgün güvenli-kapsam yayını",
                "source_kind": "release-bundle",
                "source_path": bundle,
                "release_id": catalog["releaseId"],
            })
    return subjects


def _legacy_subjects(content_root: Path, data_output: Path) -> tuple[list[dict], list[dict]]:
    subjects: list[dict] = []
    excluded: list[dict] = []
    country_slug = "turkiye"
    country_root = content_root / country_slug
    for source in sorted(country_root.glob("*/*/*.jsonl")):
        rel = source.relative_to(content_root)
        _, grade_slug, subject_slug, filename = rel.parts
        if subject_slug == "soru-bankasi":
            continue
        parsed = _read_package(source)
        if parsed["publish_blocked"]:
            excluded.append({
                "path": rel.as_posix(),
                "reason": "publishBlocked=true",
                "review_status": str(parsed["pack"].get("reviewStatus") or "pending"),
            })
            continue
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
            "package_version": str(pack.get("version") or "1"),
            "review_status": str(pack.get("reviewStatus") or "unreviewed"),
            "human_reviewed": bool(pack.get("humanReviewed", False)),
            "license": str(pack.get("license") or ""),
            "source_kind": "jsonl",
            "source_path": source,
            "release_id": "",
        })
    return subjects, excluded


def _legacy_question_banks(content_root: Path, data_output: Path) -> list[dict]:
    """Yayıma hazır Türkiye soru bankalarını ders paketlerinden ayrı toplar."""
    banks: list[dict] = []
    country_slug = "turkiye"
    country_root = content_root / country_slug
    for source in sorted(country_root.glob("*/soru-bankasi/*-2000-soru.jsonl")):
        rel = source.relative_to(content_root)
        _, grade_slug, bank_dir, filename = rel.parts
        if bank_dir != "soru-bankasi":
            continue
        parsed = _read_package(source)
        pack = parsed["pack"]
        policy = pack.get("contractPolicy") or {}
        generation = pack.get("generationPolicy") or {}
        source_packages = pack.get("sourcePackages") or []
        if parsed["publish_blocked"] or pack.get("publishReady") is not True:
            raise ValueError(f"Soru bankası yayıma hazır değil: {source}")
        if pack.get("reviewStatus") != "ai-verified" or pack.get("humanReviewed") is not False:
            raise ValueError(f"Soru bankası inceleme beyanı geçersiz: {source}")
        if parsed["questions"] != 2000 or policy.get("questionCount") != 2000:
            raise ValueError(f"Soru bankası tam 2.000 soru taşımıyor: {source}")
        if policy.get("minFamilies") != 2000 or policy.get("maxPerFamily") != 1:
            raise ValueError(f"Soru bankası özgün aile sözleşmesini karşılamıyor: {source}")
        if generation.get("sourceQuestionReuse") != "forbidden":
            raise ValueError(f"Soru bankasında ders sorusu yeniden kullanımı yasak değil: {source}")
        if not source_packages or any(row.get("questionsUsedAsSemanticInputs") != 0 for row in source_packages):
            raise ValueError(f"Soru bankası ders sorularından bağımsız değil: {source}")

        grade = int(pack.get("grade") or grade_slug.split("-")[0])
        target = data_output / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        banks.append({
            "country_slug": country_slug,
            "country": COUNTRY_NAMES[country_slug],
            "country_code": str(pack.get("country") or "TR").upper(),
            "grade_slug": grade_slug,
            "grade": grade,
            "bank_slug": "tum-dersler-2000",
            "scope": "grade-all-subjects",
            "title": str(pack.get("theme") or f"Türkiye {grade}. Sınıf — 2.000 Soruluk Soru Bankası"),
            "filename": filename,
            "download_url": f"/icerik/veri/{rel.as_posix()}",
            "sha256": _sha256(source),
            "size_bytes": source.stat().st_size,
            "questions": parsed["questions"],
            "families": policy["minFamilies"],
            "schema_version": str(pack.get("schemaVersion") or ""),
            "package_version": str(pack.get("version") or "1"),
            "review_status": str(pack.get("reviewStatus")),
            "human_reviewed": False,
            "license": str(pack.get("license") or ""),
            "independent_from_subject_packages": True,
            "source_question_reuse": "forbidden",
        })
    return banks


def _release_question_banks(content_root: Path) -> list[dict]:
    """Hash-bound JP/KR subject banks remain separate from lesson bundles."""
    pointer_path = content_root / "library/registry/current-question-bank-release.json"
    if not pointer_path.is_file():
        return []
    pointer = json.loads(pointer_path.read_text(encoding="utf-8"))
    catalog_path = content_root / pointer["catalogPath"]
    audit_path = content_root / pointer["auditPath"]
    if pointer.get("publishable") is not True or pointer.get("releaseBlockers") != []:
        raise ValueError(f"Soru bankası release işaretçisi yayımlanamaz: {pointer_path}")
    if _sha256(catalog_path) != pointer["catalogSha256"] or _sha256(audit_path) != pointer["auditSha256"]:
        raise ValueError("Soru bankası release pointer hash uyuşmazlığı")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    if (
        catalog.get("publishable") is not True
        or catalog.get("releaseBlockers") != []
        or audit.get("publishable") is not True
        or audit.get("status") != "passed"
        or audit.get("errors") != []
        or audit.get("catalogSha256") != pointer["catalogSha256"]
    ):
        raise ValueError("Soru bankası release kapısı geçmedi")

    banks: list[dict] = []
    for entry in catalog.get("packages") or []:
        bundle = content_root / entry["bundlePath"]
        if not bundle.is_file() or bundle.stat().st_size != entry["bundleBytes"] or _sha256(bundle) != entry["bundleSha256"]:
            raise ValueError(f"Soru bankası bundle hash/boyut uyuşmazlığı: {bundle}")
        if (
            entry.get("publicationStatus") != "publishable-independent-subject-question-bank"
            or entry.get("releaseBlockers") != []
            or entry.get("sourceQuestionReuse") != "forbidden"
            or entry.get("questionsUsedAsSemanticInputs") != 0
        ):
            raise ValueError(f"Soru bankası katalog kaydı geçersiz: {entry.get('cellId')}")
        with zipfile.ZipFile(bundle) as archive:
            manifest = json.loads(archive.read("MANIFEST.json"))
            package = manifest["packages"][0]
            payload = archive.read(package["path"])
            if (
                manifest.get("schema") != "alika-question-bank-bundle/v1"
                or manifest.get("publishable") is not True
                or manifest.get("humanReviewed") is not False
                or _sha256_bytes(payload) != package["sha256"]
            ):
                raise ValueError(f"Soru bankası bundle manifesti geçersiz: {bundle}")
            rows = [json.loads(line) for line in payload.decode("utf-8").splitlines() if line]
            header = rows[0]
            questions = sum(row.get("type") == "question" for row in rows[1:])
            notes = sum(row.get("type") == "note" for row in rows[1:])
            if (
                header.get("productType") != "independent-question-bank"
                or header.get("publishReady") is not True
                or header.get("generationPolicy", {}).get("sourceQuestionReuse") != "forbidden"
                or header.get("generationPolicy", {}).get("questionsUsedAsSemanticInputs") != 0
                or questions != 2000
                or notes != 23
            ):
                raise ValueError(f"Soru bankası JSONL sözleşmesi geçersiz: {bundle}")
            for asset in manifest.get("audioAssets") or []:
                data = archive.read(asset["path"])
                if len(data) != asset["bytes"] or _sha256_bytes(data) != asset["sha256"]:
                    raise ValueError(f"Soru bankası ses varlığı geçersiz: {bundle}:{asset['path']}")

        country_code = entry["country"]
        country_slug = COUNTRY_SLUGS[country_code]
        grade = entry["grade"]
        banks.append({
            "country_slug": country_slug,
            "country": COUNTRY_NAMES[country_code],
            "country_code": country_code,
            "grade_slug": f"{grade}-sinif" if isinstance(grade, int) else "11-12-sinif-secmeli",
            "grade": grade,
            "bank_slug": f"{entry['subjectCode']}-2000",
            "scope": "country-grade-subject",
            "subject_code": entry["subjectCode"],
            "subject": entry["subject"],
            "title": entry["title"],
            "filename": bundle.name,
            "download_url": f"{CONTENT_RELEASE_URL}/{bundle.name}",
            "sha256": entry["bundleSha256"],
            "size_bytes": entry["bundleBytes"],
            "questions": 2000,
            "families": 400,
            "schema_version": "2.3",
            "package_version": catalog["releaseId"],
            "review_status": entry["reviewStatus"],
            "human_reviewed": False,
            "license": "AliKa özgün güvenli-kapsam yayını",
            "independent_from_subject_packages": True,
            "source_question_reuse": "forbidden",
        })
    return banks


def _write_member(archive: zipfile.ZipFile, name: str, data: bytes) -> None:
    info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)


def _write_grade_bundle(zip_path: Path, rows: list[dict]) -> None:
    packages: list[dict] = []
    audio_assets: list[dict] = []
    members: dict[str, bytes] = {}
    release_ids: set[str] = set()

    for row in rows:
        source = row["source_path"]
        if row["source_kind"] == "jsonl":
            name = f"{row['subject_slug']}/{row['filename']}"
            data = source.read_bytes()
            members[name] = data
            packages.append({
                "path": name,
                **{key: row[key] for key in (
                    "subject", "subject_slug", "filename", "sha256", "notes", "questions",
                    "review_status", "human_reviewed", "license",
                )},
            })
            continue

        release_ids.add(row["release_id"])
        with zipfile.ZipFile(source) as source_zip:
            manifest = json.loads(source_zip.read("MANIFEST.json"))
            for package in manifest["packages"]:
                name = package["path"]
                data = source_zip.read(name)
                if name in members and members[name] != data:
                    raise ValueError(f"Sınıf ZIP üye çakışması: {name}")
                members[name] = data
                packages.append({**package, "subject": row["subject"], "subject_slug": row["subject_slug"]})
            for asset in manifest.get("audioAssets") or []:
                name = asset["path"]
                data = source_zip.read(name)
                if name in members and members[name] != data:
                    raise ValueError(f"Sınıf ZIP varlık çakışması: {name}")
                members[name] = data
                audio_assets.append(asset)

    manifest = {
        "schema": "alika-class-bundle/v2" if audio_assets else "alika-class-bundle/v1",
        "country": rows[0]["country"],
        "country_code": rows[0]["country_code"],
        "grade": rows[0]["grade"],
        "source_repository": "https://github.com/chizyo43-debug/alika-icerik",
        "source_release_ids": sorted(release_ids),
        "publishable": True,
        "quality_disclosure": "Codex öz-denetimli, makine doğrulamalı güvenli kapsam; kayıtlar insan incelemesi iddiası taşımaz.",
        "packages": packages,
    }
    if audio_assets:
        manifest["audioAssets"] = audio_assets
    with zipfile.ZipFile(zip_path, "w") as archive:
        _write_member(
            archive,
            "MANIFEST.json",
            json.dumps(manifest, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        )
        for name in sorted(members):
            _write_member(archive, name, members[name])


def build_content_catalog(content_root: Path, dist: Path) -> dict:
    """Doğrulanmış içerik deposundan site kataloğu ve sınıf ZIP'leri üretir."""
    if not content_root.is_dir():
        raise FileNotFoundError(
            "AliKa içerik deposu bulunamadı. ALIKA_CONTENT_ROOT ayarlayın veya _content yoluna checkout yapın."
        )
    output = dist / "icerik"
    data_output = output / "veri"
    bundle_output = output / "paketler"
    data_output.mkdir(parents=True, exist_ok=True)
    bundle_output.mkdir(parents=True, exist_ok=True)

    legacy_subjects, excluded = _legacy_subjects(content_root, data_output)
    question_banks = _legacy_question_banks(content_root, data_output) + _release_question_banks(content_root)
    subjects = legacy_subjects + _release_subjects(content_root)
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for subject in subjects:
        grouped[(subject["country_slug"], subject["grade_slug"])].append(subject)

    grades: list[dict] = []
    for (country_slug, grade_slug), rows in sorted(grouped.items(), key=_grade_group_sort_key):
        rows.sort(key=lambda row: (row["subject"], row["subject_slug"]))
        zip_name = f"{country_slug}-{grade_slug}-tum-dersler.zip"
        zip_path = bundle_output / zip_name
        _write_grade_bundle(zip_path, rows)
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

    public_subjects = [
        {key: value for key, value in row.items() if key not in {"source_kind", "source_path", "release_id"}}
        for row in subjects
    ]
    catalog = {
        "schema": "alika-content-catalog/v1",
        "source_repository": "https://github.com/chizyo43-debug/alika-icerik",
        "content_release": CONTENT_RELEASE_TAG,
        "quality_disclosure": "Codex öz-denetimli ve makine doğrulamalı güvenli kapsam; insan incelemesi iddiası yoktur.",
        "grades": grades,
        "subjects": public_subjects,
        "question_banks": question_banks,
        "excluded": excluded,
        "totals": {
            "countries": len({row["country_slug"] for row in grades}),
            "gradeGroups": len(grades),
            "subjects": len(public_subjects),
            "notes": sum(row["notes"] for row in public_subjects),
            "questions": sum(row["questions"] for row in public_subjects),
            "questionBanks": len(question_banks),
            "questionBankQuestions": sum(row["questions"] for row in question_banks),
        },
    }
    (output / "catalog-v1.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return catalog
