# Create 2.0 Fast Generative Video — LTX-2.5 Serverless

This isolated worker wraps the official Lightricks LTX-2.5 two-stage ComfyUI workflow for text-to-video and optional first-frame image-to-video. The ComfyUI graph stays private; the MovieBuilder 1.0 endpoint is not referenced or changed.

## API

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

For image-to-video, use action=image_to_video and add a base64 or data-URL image. The official two-stage graph always produces synchronized video and audio, so generate_audio must remain true. Start/end-frame conditioning is rejected until an official workflow for that mode is separately validated.

The public width and height are final dimensions. Because the official graph performs a 2x latent spatial upscale, the wrapper sends half-size, 32-aligned dimensions to stage 1. Final dimensions must be divisible by 64; 704x1280 is the supported vertical acceptance size. Duration is converted inside the official graph to an LTX-valid frame count of 1 plus a multiple of 8.

## Source of truth

- Official workflow file: official/LTX-2.5_T2V_I2V_Two_Stage_Distilled.json
- Official Lightricks ComfyUI-LTXVideo revision: 15d09abb5a187a8dcaea2fc31fe51ee96e6c9d0d
- Official workflow source revision recorded as: 6820fe9feeae5bfc230c77a076052d78eb1889b8
- ComfyUI: pinned stable v0.32.0, commit c2bcbecd82ec5ae66594340b395c24ef0217b238

The remote image build starts this pinned ComfyUI, installs the pinned official Lightricks node pack, queries /object_info, and converts the vendored UI workflow with ComfyUI's maintained comfy-cli converter. The build fails if any resulting API class_type is absent.

## Models and storage

The official 2.5 graph requires:

- diffusion_models/ltx-2.5-22b-distilled-transformer-bf16.safetensors
- text_encoders/gemma4-12b-with-proj-ltx-2.5-bf16.safetensors
- vae/ltx-2.5-video-vae-bf16.safetensors
- vae/ltx-2.5-audio-vae-bf16.safetensors
- latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors

RunPod's Hugging Face cache is mapped into those ComfyUI folders with symlinks at worker boot. No weights are baked into the image and no network volume is attached. The optional Comfy-Org/gemma-4 prompt-enhancer model is not mapped or loaded.

The official workflow uses BF16. The existing INT8 ConvRot checkpoint is not substituted: the official graph does not select it, and the official LTXVideo Q8 path requires an additional Q8 patching node/kernel path that would change the graph.

## Remote build

GitHub Actions/GHCR builds the image remotely from this subtree. The Windows PC is used only for source/Git/API work; Docker is not required locally.
