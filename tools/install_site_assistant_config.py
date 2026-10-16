from __future__ import annotations

import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def main() -> None:
    # Statik rehber ve dil sayfalarındaki site asistanı uç noktasını derleme ortamından yazar.
    endpoint = os.environ.get("ALIKA_ASSISTANT_ENDPOINT", "").strip().rstrip("/")
    if endpoint and not endpoint.startswith("https://"):
        raise RuntimeError("ALIKA_ASSISTANT_ENDPOINT must use HTTPS")
    config = f"window.ALIKA_ASSISTANT_CONFIG = Object.freeze({json.dumps({'endpoint': endpoint}, ensure_ascii=False, separators=(',', ':'))});\n"
    for target in (DIST / "site-assistant-config.js", DIST / "assets" / "site-assistant-config.js"):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(config, encoding="utf-8")
    print("Installed the site assistant configuration")


if __name__ == "__main__":
    main()
