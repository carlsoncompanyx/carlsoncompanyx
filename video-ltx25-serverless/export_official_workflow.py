from __future__ import annotations

import hashlib
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import requests
from comfy_cli.workflow_to_api import convert_ui_to_api

COMFY_URL = "http://127.0.0.1:8188"
WORKFLOW = Path("/app/official/LTX-2.5_T2V_I2V_Two_Stage_Distilled.json")
OUTPUT = Path("/app/workflow_api.json")
MANIFEST = Path("/app/workflow_preflight.json")
COMFY_REVISION = os.environ["COMFYUI_REVISION"]
LTXVIDEO_REVISION = os.environ["LTXVIDEO_REVISION"]
OFFICIAL_WORKFLOW_COMMIT = os.environ["LTX25_OFFICIAL_WORKFLOW_COMMIT"]


def wait_for_object_info(process: subprocess.Popen[str]) -> dict:
    deadline = time.monotonic() + 180
    last_error = ""
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"ComfyUI exited during preflight with code {process.returncode}")
        try:
            response = requests.get(f"{COMFY_URL}/object_info", timeout=10)
            if response.ok:
                return response.json()
            last_error = f"HTTP {response.status_code}"
        except requests.RequestException as exc:
            last_error = str(exc)
        time.sleep(1)
    raise TimeoutError(f"ComfyUI object_info was not ready: {last_error}")


def main() -> None:
    workflow = json.loads(WORKFLOW.read_text(encoding="utf-8"))
    workflow_sha256 = hashlib.sha256(WORKFLOW.read_bytes()).hexdigest()
    process = subprocess.Popen(
        [
            sys.executable,
            "/comfyui/main.py",
            "--cpu",
            "--listen",
            "127.0.0.1",
            "--port",
            "8188",
            "--disable-auto-launch",
        ],
        cwd="/comfyui",
        env={**os.environ, "PYTHONPATH": "/comfyui"},
        text=True,
    )
    try:
        object_info = wait_for_object_info(process)
        api_workflow = convert_ui_to_api(workflow, object_info)
        if not api_workflow:
            raise RuntimeError("Official workflow converted to an empty API graph")

        class_types = sorted(
            {
                node.get("class_type")
                for node in api_workflow.values()
                if isinstance(node, dict) and isinstance(node.get("class_type"), str)
            }
        )
        missing = [name for name in class_types if name not in object_info]
        if missing:
            raise RuntimeError(
                "Official LTX-2.5 workflow preflight found missing node types: "
                + ", ".join(missing)
            )
        if not any(node.get("class_type") == "SaveVideo" for node in api_workflow.values()):
            raise RuntimeError("Official workflow has no SaveVideo output node")

        OUTPUT.write_text(json.dumps(api_workflow, indent=2) + "\n", encoding="utf-8")
        MANIFEST.write_text(
            json.dumps(
                {
                    "comfyui_revision": COMFY_REVISION,
                    "ltxvideo_revision": LTXVIDEO_REVISION,
                    "official_workflow_commit": OFFICIAL_WORKFLOW_COMMIT,
                    "official_workflow_sha256": workflow_sha256,
                    "api_node_count": len(api_workflow),
                    "class_types": class_types,
                    "missing_class_types": missing,
                    "prompt_enhancer_enabled": False,
                    "preflight": "passed",
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        print(
            f"ltx25 preflight passed: {len(api_workflow)} API nodes; "
            f"{len(class_types)} class types; zero missing node types"
        )
    finally:
        if process.poll() is None:
            process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=20)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)


if __name__ == "__main__":
    main()
