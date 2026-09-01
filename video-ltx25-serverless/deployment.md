# Create 2.0 LTX-2.5 Serverless deployment

This directory is isolated from MovieBuilder 1.0.

## Immutable build inputs

- Remote build: GitHub Actions/GHCR
- ComfyUI: v0.32.0, commit c2bcbecd82ec5ae66594340b395c24ef0217b238
- Official Lightricks custom nodes: commit 15d09abb5a187a8dcaea2fc31fe51ee96e6c9d0d
- Official workflow: official/LTX-2.5_T2V_I2V_Two_Stage_Distilled.json
- Workflow source revision recorded in the image: 6820fe9feeae5bfc230c77a076052d78eb1889b8
- API conversion: pinned comfy-cli==1.19.0, using /object_info from the image's running ComfyUI
- Prompt enhancer: disabled

The build runs ComfyUI on the remote builder, converts the official UI graph, verifies all API class types against /object_info, requires a SaveVideo output, and writes the API graph plus a preflight manifest into the image. The GitHub workflow repeats this preflight against the pushed image digest.

## RunPod endpoint

- Name: create2-ltx25-renderer
- Type: Queue
- Minimum workers: 0
- Maximum workers: 1
- GPU pool: AMPERE_48 (A40 observed)
- Network volumes: none
- Hugging Face model cache: Lightricks/LTX-2.5
- HF token: existing RunPod secret reference only
- Idle timeout: 60 seconds
- Execution timeout: 3,600,000 ms

## Acceptance order

1. Wait for model-cache provisioning and a healthy worker.
2. Send a small T2V job through the live endpoint.
3. Decode the returned base64 MP4 and inspect it with ffprobe.
4. Send the same request again while the worker remains warm.
5. Only after T2V succeeds, send I2V with a real uploaded image.

The endpoint deliberately returns a clear validation error for first/last-frame requests because the official two-stage T2V/I2V graph does not provide that conditioning path.
