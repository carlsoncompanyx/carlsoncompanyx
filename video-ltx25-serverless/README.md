# Create 2.0 Fast Generative Video — LTX-2.5 Serverless

Standalone RunPod Serverless worker for provider-independent LTX-2.5 text-to-video generation.

This worker exposes a small logical contract and keeps the ComfyUI workflow internal. It uses the official ComfyUI LTX-2.5 text-to-video graph with prompt enhancement disabled. The MovieBuilder 1.0 endpoint is not referenced by this repository or its deployment configuration.

## API contract

```json
{
  "input": {
    "action": "text_to_video",
    "prompt": "Photorealistic golden retriever running along a beach at sunrise",
    "duration": 8,
    "width": 704,
    "height": 1280,
    "fps": 24,
    "seed": 12345,
    "generate_audio": true
  }
}
```

Dimensions must be positive multiples of 32. `720x1280` is rejected by the worker because the official LTX latent grid requires dimensions divisible by 32; the nearest vertical configuration used by the acceptance test is `704x1280`, with aspect ratio preserved and no stretch.

## Model files

The endpoint is configured for the gated `Lightricks/LTX-2.5` repository. RunPod's Hugging Face model cache is resolved into ComfyUI model directories at worker boot without copying the files:

- `diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors`
- `vae/ltx-2.5-video-vae-bf16.safetensors`
- `vae/ltx-2.5-audio-vae-bf16.safetensors`
- `latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors`

The optional `Comfy-Org/gemma-4` prompt-enhancer model is not used or cached.

## Build and deploy

The Dockerfile pins the official RunPod ComfyUI base image. Build and publish the image to an approved registry, then create a new queue endpoint with:

- minimum workers: `0`
- maximum workers: `1`
- no network volume
- `MODEL_NAME=Lightricks/LTX-2.5`
- `HF_TOKEN={{ RUNPOD_SECRET_HF_TOKEN }}` (secret reference only)

The endpoint must be created independently from all existing endpoints. The token must never be placed in source, image layers, workflow JSON, or logs.

## Verification

`tests/test_parameterization.py` validates deliberate workflow-node updates. `acceptance_request.json` is the live acceptance input. `acceptance_test.py` submits asynchronously, records queue/cold/warm timing, decodes base64 MP4 output, and runs `ffprobe`.


