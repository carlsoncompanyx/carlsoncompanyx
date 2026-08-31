from __future__ import annotations

import base64
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

import requests
import runpod
import websocket

from workflow import build_workflow

COMFY = "127.0.0.1:8188"
OUTPUT_ROOT = Path("/comfyui/output")
MAX_PROMPT = 8000


def _input(job: dict[str, Any]) -> dict[str, Any]:
    value = job.get("input", job)
    if not isinstance(value, dict):
        raise ValueError("input must be an object")
    if value.get("action") != "text_to_video":
        raise ValueError("action must be text_to_video")
    prompt = value.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt is required and must be non-empty")
    prompt = prompt.strip()
    if len(prompt) > MAX_PROMPT:
        raise ValueError(f"prompt must be <= {MAX_PROMPT} characters")
    duration = int(value.get("duration", 8))
    width = int(value.get("width", 704))
    height = int(value.get("height", 1280))
    fps = int(value.get("fps", 24))
    if not 1 <= duration <= 10:
        raise ValueError("duration must be between 1 and 10 seconds for the official LTX-2.5 graph")
    if width < 256 or height < 256 or width % 32 or height % 32:
        raise ValueError("width and height must be at least 256 and divisible by 32; 720x1280 is not a valid LTX latent-grid size, use 704x1280")
    if fps != 24:
        raise ValueError("fps must be 24 for this official LTX-2.5 workflow")
    seed = value.get("seed")
    if seed is None:
        seed = int.from_bytes(os.urandom(8), "big") % (2**63 - 1)
    if not isinstance(seed, int) or seed < 0:
        raise ValueError("seed must be a non-negative integer")
    generate_audio = value.get("generate_audio", True)
    if not isinstance(generate_audio, bool):
        raise ValueError("generate_audio must be boolean")
    return {"prompt": prompt, "duration": duration, "width": width, "height": height, "fps": fps, "seed": seed, "generate_audio": generate_audio}


def _wait_for_comfy() -> None:
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        try:
            if requests.get(f"http://{COMFY}/", timeout=5).status_code == 200:
                return
        except requests.RequestException:
            pass
        time.sleep(0.2)
    raise RuntimeError("ComfyUI did not become reachable within 600 seconds")


def _file_from_history(history: dict[str, Any], started_at: float) -> Path:
    candidates: list[Path] = []
    for node in history.values():
        for output in (node.get("outputs", {}) if isinstance(node, dict) else {}).values():
            values = output if isinstance(output, list) else [output]
            for item in values:
                if not isinstance(item, dict):
                    continue
                filename = item.get("filename")
                if not filename:
                    continue
                root = OUTPUT_ROOT / item.get("subfolder", "")
                candidate = root / filename
                if candidate.suffix.lower() in {".mp4", ".mov", ".webm", ".mkv"} and candidate.is_file():
                    candidates.append(candidate)
    if not candidates:
        candidates = [p for p in OUTPUT_ROOT.rglob("*") if p.suffix.lower() == ".mp4" and p.is_file() and p.stat().st_mtime >= started_at - 2]
    if not candidates:
        raise FileNotFoundError("ComfyUI completed without a video output file")
    return max(candidates, key=lambda p: p.stat().st_mtime)


def _run_comfy(workflow: dict[str, Any]) -> tuple[Path, float]:
    _wait_for_comfy()
    client_id = str(uuid.uuid4())
    submitted_at = time.monotonic()
    response = requests.post(f"http://{COMFY}/prompt", json={"prompt": workflow, "client_id": client_id}, timeout=60)
    response.raise_for_status()
    payload = response.json()
    if payload.get("error"):
        raise RuntimeError(json.dumps(payload))
    prompt_id = payload.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"ComfyUI did not return prompt_id: {payload}")
    ws = websocket.create_connection(f"ws://{COMFY}/ws?clientId={client_id}", timeout=30)
    try:
        while True:
            raw = ws.recv()
            message = json.loads(raw) if isinstance(raw, str) else {}
            if message.get("type") == "execution_error":
                raise RuntimeError(json.dumps(message.get("data", {})))
            if message.get("type") == "executing" and message.get("data", {}).get("prompt_id") == prompt_id and message.get("data", {}).get("node") is None:
                break
    finally:
        ws.close()
    history_response = requests.get(f"http://{COMFY}/history/{prompt_id}", timeout=60)
    history_response.raise_for_status()
    output = _file_from_history(history_response.json().get(prompt_id, {}), time.time() - 3600)
    return output, (time.monotonic() - submitted_at) * 1000


def handler(job: dict[str, Any]) -> dict[str, Any]:
    request = _input(job)
    started = time.monotonic()
    workflow = build_workflow(**request)
    output_path, elapsed_ms = _run_comfy(workflow)
    encoded = base64.b64encode(output_path.read_bytes()).decode("ascii")
    return {
        "model": "Lightricks/LTX-2.5",
        "implementation": "ltx-2.5-distilled-comfy-int8-convrot",
        "workflow_revision": os.environ.get("LTX25_WORKFLOW_REVISION", "unknown"),
        "seed": request["seed"],
        "duration": request["duration"],
        "width": request["width"],
        "height": request["height"],
        "fps": request["fps"],
        "generate_audio": request["generate_audio"],
        "inference_ms": round(elapsed_ms),
        "total_handler_ms": round((time.monotonic() - started) * 1000),
        "video": {"mime_type": "video/mp4", "filename": output_path.name, "data": encoded},
    }


runpod.serverless.start({"handler": handler})

