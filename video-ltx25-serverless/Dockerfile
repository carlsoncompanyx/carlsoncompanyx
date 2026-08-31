FROM runpod/worker-comfyui:5.8.6-base-cuda12.8.1
LABEL org.opencontainers.image.title="Create 2.0 LTX-2.5 Serverless Renderer"
LABEL org.opencontainers.image.description="Pinned official ComfyUI worker with one API for the three official LTX-2.5 generation modes"
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    COMFY_API_AVAILABLE_INTERVAL_MS=200 \
    COMFY_API_AVAILABLE_MAX_RETRIES=0 \
    REFRESH_WORKER=false \
    LTX25_WORKFLOW_REVISION="07824bbb-6672-4bb0-ac36-4313a519e35b;0112e9af-5129-48ba-af78-92c40ac40b40" \
    LTX25_WORKFLOW_SOURCE_REVISION=main \
    LTX25_DISABLE_PROMPT_ENHANCE=true \
    LTX25_CACHE_ROOT=/runpod-volume/huggingface-cache/hub
COPY workflow_api.json /app/workflow_api.json
COPY workflow_i2v_api.json /app/workflow_i2v_api.json
COPY workflow_flf2v_api.json /app/workflow_flf2v_api.json
COPY workflow.py /app/workflow.py
COPY model_cache.py /app/model_cache.py
COPY requirements.txt /app/requirements.txt
COPY handler.py /handler.py
COPY entrypoint.sh /app/entrypoint.sh
RUN pip install --no-cache-dir -r /app/requirements.txt && chmod +x /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]
