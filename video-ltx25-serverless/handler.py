from __future__ import annotations
import base64,binascii,json,mimetypes,os,time,uuid
from pathlib import Path
from typing import Any
import requests,runpod,websocket
from workflow import build_workflow,workflow_id
COMFY="127.0.0.1:8188"; OUTPUT_ROOT=Path("/comfyui/output"); MAX_PROMPT=8000; MAX_IMAGE_BYTES=20*1024*1024
def _input(job:dict[str,Any])->dict[str,Any]:
    v=job.get("input",job)
    if not isinstance(v,dict):raise ValueError("input must be an object")
    action=v.get("action")
    if action not in {"text_to_video","image_to_video","first_last_frame_to_video"}:raise ValueError("action must be text_to_video, image_to_video, or first_last_frame_to_video")
    prompt=v.get("prompt")
    if not isinstance(prompt,str) or not prompt.strip():raise ValueError("prompt is required and must be non-empty")
    if len(prompt.strip())>MAX_PROMPT:raise ValueError(f"prompt must be <= {MAX_PROMPT} characters")
    try:duration,width,height,fps=(int(v.get(k,d)) for k,d in (("duration",8),("width",704),("height",1280),("fps",24)))
    except(TypeError,ValueError) as exc:raise ValueError("duration, width, height, and fps must be integers") from exc
    if not 1<=duration<=10:raise ValueError("duration must be between 1 and 10 seconds")
    if width<256 or height<256 or width%32 or height%32:raise ValueError("width and height must be at least 256 and divisible by 32; use 704x1280 for vertical output")
    if fps!=24:raise ValueError("fps must be 24 for the official LTX-2.5 workflows")
    seed=v.get("seed")
    if seed is None:seed=int.from_bytes(os.urandom(8),"big")%(2**63-1)
    if not isinstance(seed,int) or isinstance(seed,bool) or seed<0:raise ValueError("seed must be a non-negative integer")
    audio=v.get("generate_audio",True)
    if not isinstance(audio,bool):raise ValueError("generate_audio must be boolean")
    r={"action":action,"prompt":prompt.strip(),"duration":duration,"width":width,"height":height,"fps":fps,"seed":seed,"generate_audio":audio}
    if action=="image_to_video":
        r["image"]=v.get("image")
        if not isinstance(r["image"],str) or not r["image"].strip():raise ValueError("image is required for image_to_video as base64 or data URL")
    if action=="first_last_frame_to_video":
        for key in ("first_image","last_image"):
            r[key]=v.get(key)
            if not isinstance(r[key],str) or not r[key].strip():raise ValueError(f"{key} is required for first_last_frame_to_video")
    return r
def _decode_image(value:str,label:str)->tuple[bytes,str,str]:
    mime,payload="image/png",value.strip()
    if payload.startswith("data:") and "," in payload:
        h,payload=payload.split(",",1);mime=h[5:].split(";",1)[0] or mime
    try:data=base64.b64decode(payload,validate=True)
    except(binascii.Error,ValueError) as exc:raise ValueError(f"{label} must be valid base64 image data") from exc
    if not data or len(data)>MAX_IMAGE_BYTES:raise ValueError(f"{label} is empty or exceeds {MAX_IMAGE_BYTES} bytes")
    return data,mime,f"ltx25_{label}_{uuid.uuid4().hex}{mimetypes.guess_extension(mime) or '.png'}"
def _upload_image(value:str,label:str)->str:
    data,mime,filename=_decode_image(value,label)
    response=requests.post(f"http://{COMFY}/upload/image",files={"image":(filename,data,mime)},data={"overwrite":"true","type":"input"},timeout=120);response.raise_for_status()
    name=response.json().get("name")
    if not name:raise RuntimeError("ComfyUI image upload did not return a name")
    return name
def _wait_for_comfy()->None:
    deadline=time.monotonic()+600
    while time.monotonic()<deadline:
        try:
            if requests.get(f"http://{COMFY}/",timeout=5).status_code==200:return
        except requests.RequestException:pass
        time.sleep(.5)
    raise RuntimeError("ComfyUI did not become reachable within 600 seconds")
def _file_from_history(history:dict[str,Any],started_at:float)->Path:
    candidates=[]
    for node in history.values():
        for output in (node.get("outputs",{}) if isinstance(node,dict) else {}).values():
            for item in (output if isinstance(output,list) else [output]):
                if isinstance(item,dict) and item.get("filename"):
                    p=OUTPUT_ROOT/item.get("subfolder","")/item["filename"]
                    if p.suffix.lower() in {".mp4",".mov",".webm",".mkv"} and p.is_file():candidates.append(p)
    if not candidates:candidates=[p for p in OUTPUT_ROOT.rglob("*") if p.suffix.lower()==".mp4" and p.is_file() and p.stat().st_mtime>=started_at-2]
    if not candidates:raise FileNotFoundError("ComfyUI completed without a video output file")
    return max(candidates,key=lambda p:p.stat().st_mtime)
def _run_comfy(workflow:dict[str,Any])->tuple[Path,float]:
    _wait_for_comfy();client_id=str(uuid.uuid4());submitted=time.monotonic();wall_started=time.time()
    response=requests.post(f"http://{COMFY}/prompt",json={"prompt":workflow,"client_id":client_id},timeout=60);response.raise_for_status();payload=response.json()
    if payload.get("error"):raise RuntimeError(json.dumps(payload))
    prompt_id=payload.get("prompt_id")
    if not prompt_id:raise RuntimeError(f"ComfyUI did not return prompt_id: {payload}")
    ws=None
    try:
        ws=websocket.create_connection(f"ws://{COMFY}/ws?clientId={client_id}",timeout=30)
        while True:
            raw=ws.recv();message=json.loads(raw) if isinstance(raw,str) else {}
            if message.get("type")=="execution_error":raise RuntimeError(json.dumps(message.get("data",{})))
            if message.get("type")=="executing" and message.get("data",{}).get("prompt_id")==prompt_id and message.get("data",{}).get("node") is None:break
    except (OSError,websocket.WebSocketException):pass
    finally:
        if ws is not None:
            try:ws.close()
            except OSError:pass
    deadline=time.monotonic()+1200
    while time.monotonic()<deadline:
        history=requests.get(f"http://{COMFY}/history/{prompt_id}",timeout=60);history.raise_for_status()
        try:return _file_from_history(history.json().get(prompt_id,{}),wall_started),(time.monotonic()-submitted)*1000
        except FileNotFoundError:time.sleep(1)
    raise TimeoutError("ComfyUI did not produce a saved video within 1200 seconds")
def _peak_vram_gb():
    try:
        import torch
        return round(torch.cuda.max_memory_reserved()/(1024**3),2) if torch.cuda.is_available() else None
    except Exception:return None
def handler(job:dict[str,Any])->dict[str,Any]:
    r=_input(job);started=time.monotonic();images={}
    if r["action"]=="image_to_video":images["first_image"]=_upload_image(r["image"],"image")
    elif r["action"]=="first_last_frame_to_video":
        images["first_image"]=_upload_image(r["first_image"],"first_image");images["last_image"]=_upload_image(r["last_image"],"last_image")
    w=build_workflow(image_filenames=images,**{k:r[k] for k in ("action","prompt","duration","width","height","fps","seed","generate_audio")});output,inference_ms=_run_comfy(w)
    return {"action":r["action"],"model":"Lightricks/LTX-2.5","implementation":"ltx-2.5-distilled-comfy-int8-convrot","workflow_id":workflow_id(r["action"]),"workflow_revision":os.environ.get("LTX25_WORKFLOW_REVISION","unknown"),"seed":r["seed"],"duration":r["duration"],"width":r["width"],"height":r["height"],"fps":r["fps"],"generate_audio":r["generate_audio"],"inference_ms":round(inference_ms),"total_handler_ms":round((time.monotonic()-started)*1000),"peak_vram_gb":_peak_vram_gb(),"video":{"mime_type":"video/mp4","filename":output.name,"data":base64.b64encode(output.read_bytes()).decode("ascii")}}
runpod.serverless.start({"handler":handler})
