from __future__ import annotations

import copy
import json
import os
from pathlib import Path
from typing import Any

OFFICIAL_WORKFLOW_COMMIT = os.environ.get(
    "LTX25_OFFICIAL_WORKFLOW_COMMIT",
    "6820fe9feeae5bfc230c77a076052d78eb1889b8",
)
WORKFLOW_API = Path("/app/workflow_api.json")


def workflow_id(action: str) -> str:
    if action not in {"text_to_video", "image_to_video"}:
        raise ValueError("the official two-stage workflow supports text_to_video and image_to_video")
    return OFFICIAL_WORKFLOW_COMMIT


def _load_template() -> dict[str, Any]:
    return copy.deepcopy(json.loads(WORKFLOW_API.read_text(encoding="utf-8")))


def _set_required(workflow: dict[str, Any], node_id: str, name: str, value: Any) -> None:
    node = workflow.get(node_id)
    if not isinstance(node, dict):
        raise RuntimeError(f"official API workflow node {node_id!r} is missing")
    inputs = node.get("inputs")
    if not isinstance(inputs, dict) or name not in inputs:
        raise RuntimeError(f"official API workflow node {node_id!r} does not expose input {name!r}")
    inputs[name] = value


def build_workflow(
    *,
    action: str,
    prompt: str,
    duration: int,
    width: int,
    height: int,
    fps: int,
    seed: int,
    generate_audio: bool,
    image_filename: str | None = None,
    template: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if action not in {"text_to_video", "image_to_video"}:
        raise ValueError(
            "first_last_frame_to_video is intentionally not implemented: "
            "the official T2V/I2V graph does not expose that conditioning path"
        )
    if not generate_audio:
        raise ValueError("generate_audio=false is not supported by the official joint video/audio graph")

    workflow = copy.deepcopy(template) if template is not None else _load_template()

    # The official graph's stage-2 latent spatial upscaler doubles dimensions.
    # Public dimensions are final dimensions; stage 1 receives half-size values.
    _set_required(workflow, "5508", "value", prompt)
    _set_required(workflow, "5512", "value", float(duration))
    _set_required(workflow, "5511", "value", float(fps))
    _set_required(workflow, "5514:3059", "width", width // 2)
    _set_required(workflow, "5514:3059", "height", height // 2)
    _set_required(workflow, "5014:4988", "value", seed)
    _set_required(workflow, "5014:5506", "value", action == "image_to_video")

    if action == "image_to_video":
        if not image_filename:
            raise ValueError("image_filename is required for image_to_video")
        _set_required(workflow, "2004", "image", image_filename)
    else:
        _set_required(workflow, "2004", "image", "")

    _set_required(workflow, "4852", "filename_prefix", "ltx25/create2")
    return workflow


def validate_workflow_values(
    workflow: dict[str, Any],
    *,
    action: str,
    prompt: str,
    duration: int,
    width: int,
    height: int,
    fps: int,
    seed: int,
    generate_audio: bool,
    image_filename: str | None = None,
) -> None:
    assert workflow["5508"]["inputs"]["value"] == prompt
    assert workflow["5512"]["inputs"]["value"] == float(duration)
    assert workflow["5511"]["inputs"]["value"] == float(fps)
    assert workflow["5514:3059"]["inputs"]["width"] == width // 2
    assert workflow["5514:3059"]["inputs"]["height"] == height // 2
    assert workflow["5014:4988"]["inputs"]["value"] == seed
    assert workflow["5014:5506"]["inputs"]["value"] == (action == "image_to_video")
    assert workflow["4852"]["inputs"]["filename_prefix"] == "ltx25/create2"
    if action == "image_to_video":
        assert workflow["2004"]["inputs"]["image"] == image_filename
    else:
        assert workflow["2004"]["inputs"]["image"] == ""
    assert generate_audio is True
