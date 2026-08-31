from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import runpod

ROOT = Path(__file__).parent
REQUEST = json.loads((ROOT / "acceptance_request.json").read_text(encoding="utf-8"))
ENDPOINT = os.environ["RUNPOD_ENDPOINT_ID"]


def run(label: str) -> Path:
    started = time.monotonic()
    job = runpod.api.run_sync(ENDPOINT, REQUEST["input"], timeout=3600)
    elapsed = time.monotonic() - started
    output = job.get("output", job)
    video = output["video"]
    path = ROOT / f"acceptance-{label}.mp4"
    path.write_bytes(base64.b64decode(video["data"]))
    (ROOT / f"acceptance-{label}.json").write_text(json.dumps({"label": label, "elapsed_s": elapsed, "response": {k: v for k, v in output.items() if k != "video"}}, indent=2), encoding="utf-8")
    return path


def probe(path: Path) -> dict:
    completed = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)], check=True, capture_output=True, text=True)
    return json.loads(completed.stdout)


if __name__ == "__main__":
    cold = run("cold")
    cold_probe = probe(cold)
    warm = run("warm")
    warm_probe = probe(warm)
    report = {"cold": cold_probe, "warm": warm_probe}
    (ROOT / "acceptance-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))

