FROM runpod/worker-comfyui:5.8.6-base-cuda12.8.1

ARG COMFYUI_REVISION=c2bcbecd82ec5ae66594340b395c24ef0217b238
ARG LTXVIDEO_REVISION=15d09abb5a187a8dcaea2fc31fe51ee96e6c9d0d
ARG LTX25_OFFICIAL_WORKFLOW_COMMIT=6820fe9feeae5bfc230c77a076052d78eb1889b8

LABEL org.opencontainers.image.title="Create 2.0 LTX-2.5 Serverless Renderer"
LABEL org.opencontainers.image.description="Thin RunPod worker around the official Lightricks LTX-2.5 T2V/I2V two-stage workflow"
LABEL org.opencontainers.image.comfyui.revision="${COMFYUI_REVISION}"
LABEL org.opencontainers.image.ltxvideo.revision="${LTXVIDEO_REVISION}"
LABEL org.opencontainers.image.ltx25.workflow="${LTX25_OFFICIAL_WORKFLOW_COMMIT}"

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app:/comfyui \
    COMFY_API_AVAILABLE_INTERVAL_MS=200 \
    COMFY_API_AVAILABLE_MAX_RETRIES=0 \
    REFRESH_WORKER=false \
    COMFYUI_REVISION="${COMFYUI_REVISION}" \
    LTXVIDEO_REVISION="${LTXVIDEO_REVISION}" \
    LTX25_OFFICIAL_WORKFLOW_COMMIT="${LTX25_OFFICIAL_WORKFLOW_COMMIT}" \
    LTX25_DISABLE_PROMPT_ENHANCE=true \
    LTX25_CACHE_ROOT=/runpod-volume/huggingface-cache/hub

RUN set -eux; \
    git clone --filter=blob:none --no-checkout https://github.com/Comfy-Org/ComfyUI.git /tmp/comfyui; \
    git -C /tmp/comfyui fetch --depth 1 origin "${COMFYUI_REVISION}"; \
    git -C /tmp/comfyui checkout --detach "${COMFYUI_REVISION}"; \
    rm -rf /comfyui; \
    mv /tmp/comfyui /comfyui; \
    python -m pip install --no-cache-dir -r /comfyui/requirements.txt

RUN set -eux; \
    git clone --filter=blob:none --no-checkout https://github.com/Lightricks/ComfyUI-LTXVideo.git /comfyui/custom_nodes/ComfyUI-LTXVideo; \
    git -C /comfyui/custom_nodes/ComfyUI-LTXVideo fetch --depth 1 origin "${LTXVIDEO_REVISION}"; \
    git -C /comfyui/custom_nodes/ComfyUI-LTXVideo checkout --detach "${LTXVIDEO_REVISION}"; \
    python -m pip install --no-cache-dir -r /comfyui/custom_nodes/ComfyUI-LTXVideo/requirements.txt; \
    python -m pip install --no-cache-dir "kornia==0.7.4"

COPY requirements.txt /app/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/requirements.txt

COPY official/LTX-2.5_T2V_I2V_Two_Stage_Distilled.json /app/official/LTX-2.5_T2V_I2V_Two_Stage_Distilled.json
COPY export_official_workflow.py /app/export_official_workflow.py
RUN python /app/export_official_workflow.py

COPY workflow.py /app/workflow.py
COPY model_cache.py /app/model_cache.py
COPY handler.py /handler.py
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
