# Create 2.0 LTX-2.5 Serverless deployment

This directory is an isolated worker for the new `create2-ltx25-t2v` RunPod Queue endpoint. It does not reference or mutate MovieBuilder 1.0.

## Image

The image is built for `linux/amd64` from the official RunPod ComfyUI base `runpod/worker-comfyui:5.8.6-base-cuda12.8.1`. The base tag resolves to the digest recorded by the build log; the worker code and workflow are pinned by the Git commit.

The GitHub Actions build publishes a tagged image to GHCR. The image contains no model weights and no credentials. Only the five required LTX-2.5 files are resolved at runtime from RunPod's Hugging Face cache.

## RunPod endpoint

- Name: `create2-ltx25-t2v`
- Type: Queue
- Minimum workers: `0`
- Maximum workers: `1`
- GPU pool: start with live-discovered `AMPERE_48` (A40/RTX A6000 class)
- Network volume: none
- Hugging Face model: `Lightricks/LTX-2.5`
- Secret: bind an existing RunPod secret reference to `HF_TOKEN`; never put the token in Git, the image, the workflow, or logs.
- Prompt enhancer: disabled; the optional Gemma enhancer checkpoint is not mapped or loaded.

## Acceptance procedure

1. Confirm the Hugging Face account has accepted access to `Lightricks/LTX-2.5`.
2. Deploy the image and wait for a healthy worker.
3. Submit `acceptance_request.json` through `/run`.
4. Poll until `COMPLETED`, decode `output.video.data`, and run the acceptance script's ffprobe checks.
5. Submit the same request again while the worker remains warm; compare initialization and inference timings and worker logs.

The official workflow's latent dimensions must be multiples of 32. Therefore the requested 720x1280 target is rejected by the worker; the acceptance fixture uses the nearest vertical supported size, 704x1280, without aspect-ratio distortion.

