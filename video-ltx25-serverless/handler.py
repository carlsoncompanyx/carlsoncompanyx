from __future__ import annotations

import base64
import binascii
import json
import mimetypes
import os
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any

import requests
import runpod
import websocket

from workflow import build_workflow, workflow_id

COMFY = "127.0.0.1:8188"
OUTPUT_ROOT = Path("/comfyui/output")
MAX_PROMPT = 8000
MAX_IMAGE_BYTES = 20 * 1024 * 1024


def _input(job: dict[str, Any]) -> dict[str, Any]:
    value = job.get("input", job)
    if not isinstance(value, dict):
        raise ValueError("input must be an object")
    action = value.get("action")
    if action == "first_last_frame_to_video":
        raise ValueError(
            "first_last_frame_to_video is not enabled: the official LTX-2.5 "
            "T2V/I2V two-stage workflow does not expose start/end-frame conditioning"
        )
    if action not in {"text_to_video", "image_to_video"}:
        raise ValueError("action must be text_to_video or image_to_video")
    prompt = value.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt is required and must be non-empty")
    if len(prompt.strip()) > MAX_PROMPT:
        raise ValueError(f"prompt must be <= {MAX_PROMPT} characters")
    try:
        duration = int(value.get("duration", 8))
        width = int(value.get("width", 704))
        height = int(value.get("height", 1280))
        fps = int(value.get("fps", 24))
    except (TypeError, ValueError) as exc:
        raise ValueError("duration, width, height, and fps must be integers") from exc
    if not 1 <= duration <= 10:
        raise ValueError("duration must be between 1 and 10 seconds")
    if width < 256 or height < 256 or width % 64 or height % 64:
        raise ValueError(
            "final width and height must be at least 256 and divisible by 64; "
            "the two-stage graph uses a 2x spatial upscale"
        )
    if fps != 24:
        raise ValueError("fps must be 24 for the official LTX-2.5 workflow")
    seed = value.get("seed")
    if seed is None:
        seed = int.from_bytes(os.urandom(8), "big") % (2**63 - 1)
    if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
        raise ValueError("seed must be a non-negative integer")
    generate_audio = value.get("generate_audio", True)
    if generate_audio is not True:
        raise ValueError("generate_audio must be true because the official graph generates synchronized audio")
    result = {
        "action": action,
        "prompt": prompt.strip(),
        "duration": duration,
        "width": width,
        "height": height,
        "fps": fps,
        "seed": seed,
        "generate_audio": True,
    }
    if action == "image_to_video":
        image = value.get("image")
        if not isinstance(image, str) or not image.strip():
            raise ValueError("image is required for image_to_video as base64 or data URL")
        result["image"] = image
    return result


def _decode_image(value: str, label: str) -> tuple[bytes, str, str]:
    mime = "image/png"
    payload = value.strip()
    if payload.startswith("data:") and "," in payload:
        header, payload = payload.split(",", 1)
        mime = header[5:].split(";", 1)[0] or mime
    try:
        data = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError(f"{label} must be valid base64 image data") from exc
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise ValueError(f"{label} is empty or exceeds {MAX_IMAGE_BYTES} bytes")
    filename = f"ltx25_{label}_{uuid.uuid4().hex}{mimetypes.guess_extension(mime) or '.png'}"
    return data, mime, filename


def _upload_image(value: str, label: str) -> str:
    data, mime, filename = _decode_image(value, label)
    response = requests.post(
        f"http://{COMFY}/upload/image",
        files={"image": (filename, data, mime)},
        data={"overwrite": "true", "type": "input"},
        timeout=120,
    )
    response.raise_for_status()
    name = response.json().get("name")
    if not name:
        raise RuntimeError("ComfyUI image upload did not return a name")
    return name


def _wait_for_comfy() -> None:
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        try:
            if requests.get(f"http://{COMFY}/", timeout=5).status_code == 200:
                return
        except requests.RequestException:
            pass
        time.sleep(0.5)
    raise RuntimeError("ComfyUI did not become reachable within 600 seconds")


def _file_from_history(history: dict[str, Any], started_at: float) -> Path:
    candidates: list[Path] = []
    for node in history.values():
        outputs = node.get("outputs", {}) if isinstance(node, dict) else {}
        for output in outputs.values() if isinstance(outputs, dict) else []:
            items = output if isinstance(output, list) else [output]
            for item in items:
                if isinstance(item, dict) and item.get("filename"):
                    path = OUTPUT_ROOT / item.get("subfolder", "") / item["filename"]
                    if path.suffix.lower() in {".mp4", ".mov", ".webm", ".mkv"} and path.is_file():
                        candidates.append(path)
    if not candidates:
        candidates = [
            path for path in OUTPUT_ROOT.rglob("*")
            if path.suffix.lower() == ".mp4"
            and path.is_file()
            and path.stat().st_mtime >= started_at - 2
        ]
    if not candidates:
        raise FileNotFoundError("ComfyUI completed without a video output file")
    return max(candidates, key=lambda path: path.stat().st_mtime)


def _run_comfy(workflow: dict[str, Any]) -> tuple[Path, float]:
    _wait_for_comfy()
    client_id = str(uuid.uuid4())
    submitted = time.monotonic()
    started_at = time.time()
    response = requests.post(
        f"http://{COMFY}/prompt",
        json={"prompt": workflow, "client_id": client_id},
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("error"):
        raise RuntimeError(json.dumps(payload))
    prompt_id = payload.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"ComfyUI did not return prompt_id: {payload}")

    try:
        ws = websocket.create_connection(f"ws://{COMFY}/ws?clientId={client_id}", timeout=30)
        ws.close()
    except (OSError, websocket.WebSocketException):
        pass

    deadline = time.monotonic() + 1800
    while time.monotonic() < deadline:
        history = requests.get(f"http://{COMFY}/history/{prompt_id}", timeout=60)
        history.raise_for_status()
        entry = history.json().get(prompt_id, {})
        status = entry.get("status", {}) if isinstance(entry, dict) else {}
        if status.get("status_str") == "error":
            raise RuntimeError(json.dumps(status))
        try:
            return _file_from_history(entry, started_at), (time.monotonic() - submitted) * 1000
        except FileNotFoundError:
            time.sleep(1)
    raise TimeoutError("ComfyUI did not produce a saved video within 1800 seconds")


def _probe(path: Path) -> dict[str, Any]:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames",
        "-of",
        "json",
        str(path),
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError):
        return {}


def handler(job: dict[str, Any]) -> dict[str, Any]:
    request = _input(job)
    started = time.monotonic()
    image_filename = None
    if request["action"] == "image_to_video":
        image_filename = _upload_image(request["image"], "image")

    workflow = build_workflow(
        action=request["action"],
        prompt=request["prompt"],
        duration=request["duration"],
        width=request["width"],
        height=request["height"],
        fps=request["fps"],
        seed=request["seed"],
        generate_audio=request["generate_audio"],
        image_filename=image_filename,
    )
    output, inference_ms = _run_comfy(workflow)
    probe = _probe(output)
    video_stream = next(
        (stream for stream in probe.get("streams", []) if stream.get("codec_type") == "video"),
        {},
    )
    audio_present = any(
        stream.get("codec_type") == "audio" for stream in probe.get("streams", [])
    )
    return {
        "action": request["action"],
        "model": "Lightricks/LTX-2.5",
        "implementation": "ltx-2.5-distilled-comfy-bf16",
        "workflow_revision": workflow_id(request["action"]),
        "seed": request["seed"],
        "requested_duration": request["duration"],
        "requested_width": request["width"],
        "requested_height": request["height"],
        "fps": request["fps"],
        "generate_audio": request["generate_audio"],
        "inference_ms": round(inference_ms),
        "total_handler_ms": round((time.monotonic() - started) * 1000),
        "frame_count": int(video_stream["nb_frames"]) if video_stream.get("nb_frames") else None,
        "actual_duration_s": float(probe.get("format", {}).get("duration", 0) or 0),
        "actual_width": video_stream.get("width"),
        "actual_height": video_stream.get("height"),
        "video_codec": video_stream.get("codec_name"),
        "audio_present": audio_present,
        "video": {
            "mime_type": "video/mp4",
            "filename": output.name,
            "data": base64.b64encode(output.read_bytes()).decode("ascii"),
        },
    }


runpod.serverless.start({"handler": handler})
