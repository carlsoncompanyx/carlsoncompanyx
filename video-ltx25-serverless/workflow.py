from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

WORKFLOW_PATH = Path(__file__).with_name("workflow_api.json")


def _frames(duration: int, fps: int) -> int:
    return duration * fps + 1


def build_workflow(*, prompt: str, duration: int, width: int, height: int, fps: int, seed: int, generate_audio: bool) -> dict[str, Any]:
    workflow = copy.deepcopy(json.loads(WORKFLOW_PATH.read_text(encoding="utf-8")))
    workflow["398:364"]["inputs"]["text"] = prompt
    workflow["398:361"]["inputs"]["value"] = fps
    workflow["398:372"]["inputs"]["value"] = width
    workflow["398:360"]["inputs"]["value"] = height
    workflow["398:362"]["inputs"]["value"] = duration
    workflow["398:339"]["inputs"]["noise_seed"] = seed
    workflow["398:370"]["inputs"]["audio"] = ["398:358", 0] if generate_audio else None
    if not generate_audio:
        workflow["398:370"]["inputs"].pop("audio", None)
    return workflow


def validate_workflow_values(workflow: dict[str, Any], expected: dict[str, Any]) -> None:
    assert workflow["398:364"]["inputs"]["text"] == expected["prompt"]
    assert workflow["398:372"]["inputs"]["value"] == expected["width"]
    assert workflow["398:360"]["inputs"]["value"] == expected["height"]
    assert workflow["398:361"]["inputs"]["value"] == expected["fps"]
    assert workflow["398:362"]["inputs"]["value"] == expected["duration"]
    assert workflow["398:339"]["inputs"]["noise_seed"] == expected["seed"]
    assert workflow["398:370"]["inputs"].get("audio") == (["398:358", 0] if expected["generate_audio"] else None)

