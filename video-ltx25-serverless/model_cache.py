from __future__ import annotations

import json
import os
from pathlib import Path

MODEL_ID = "Lightricks/LTX-2.5"
REQUIRED = {
    "diffusion_models": "ltx-2.5-22b-distilled-transformer-bf16.safetensors",
    "text_encoders": "gemma4-12b-with-proj-ltx-2.5-bf16.safetensors",
    "vae_video": "ltx-2.5-video-vae-bf16.safetensors",
    "vae_audio": "ltx-2.5-audio-vae-bf16.safetensors",
    "latent_upscale_models": "ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors",
}


def resolve_snapshot(root: Path, model_id: str = MODEL_ID) -> Path:
    org, name = model_id.split("/", 1)
    model_root = root / f"models--{org}--{name}"
    ref = model_root / "refs" / "main"
    if ref.is_file():
        snapshot = model_root / "snapshots" / ref.read_text(encoding="utf-8").strip()
        if snapshot.is_dir():
            return snapshot
    snapshots = sorted(p for p in (model_root / "snapshots").glob("*") if p.is_dir())
    if snapshots:
        return snapshots[-1]
    raise FileNotFoundError(f"RunPod Hugging Face cache snapshot not found for {model_id}")


def prepare_models() -> dict[str, object]:
    cache_root = Path(os.environ.get("LTX25_CACHE_ROOT", "/runpod-volume/huggingface-cache/hub"))
    snapshot = resolve_snapshot(cache_root)
    comfy_root = Path("/comfyui")
    targets = {
        "diffusion_models": comfy_root / "models" / "diffusion_models",
        "text_encoders": comfy_root / "models" / "text_encoders",
        "vae": comfy_root / "models" / "vae",
        "latent_upscale_models": comfy_root / "models" / "latent_upscale_models",
    }
    for target in targets.values():
        target.mkdir(parents=True, exist_ok=True)

    mapped: dict[str, str] = {}
    for directory, filename in REQUIRED.items():
        source_dir = snapshot / ("vae" if directory.startswith("vae_") else directory)
        target_dir = targets["vae" if directory.startswith("vae_") else directory]
        source = source_dir / filename
        if not source.is_file():
            raise FileNotFoundError(
                f"official LTX-2.5 workflow model missing from cache: {directory}/{filename}"
            )
        target = target_dir / filename
        if target.exists() or target.is_symlink():
            target.unlink()
        target.symlink_to(source)
        mapped[directory] = str(target)

    state = {
        "model_id": MODEL_ID,
        "snapshot": str(snapshot),
        "files": mapped,
        "prompt_enhancer": "disabled and intentionally not mapped",
        "transformer_quantization": "official BF16 workflow; INT8 ConvRot not substituted",
    }
    Path("/tmp/ltx25-model-state.json").write_text(
        json.dumps(state, indent=2) + "\n", encoding="utf-8"
    )
    return state
