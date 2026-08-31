from __future__ import annotations
import copy, json
from pathlib import Path
from typing import Any
WORKFLOW_FILES={"text_to_video":"workflow_api.json","image_to_video":"workflow_i2v_api.json","first_last_frame_to_video":"workflow_flf2v_api.json"}
WORKFLOW_IDS={"text_to_video":"07824bbb-6672-4bb0-ac36-4313a519e35b","image_to_video":"07824bbb-6672-4bb0-ac36-4313a519e35b","first_last_frame_to_video":"0112e9af-5129-48ba-af78-92c40ac40b40"}
def workflow_id(action:str)->str:return WORKFLOW_IDS[action]
def _load(action:str)->dict[str,Any]:return copy.deepcopy(json.loads(Path(__file__).with_name(WORKFLOW_FILES[action]).read_text(encoding="utf-8")))
def _set_audio(w:dict[str,Any],node:str,link:list[Any],enabled:bool)->None:
    if enabled:w[node]["inputs"]["audio"]=link
    else:w[node]["inputs"].pop("audio",None)
def build_workflow(*,action:str,prompt:str,duration:int,width:int,height:int,fps:int,seed:int,generate_audio:bool,image_filenames:dict[str,str]|None=None)->dict[str,Any]:
    w=_load(action); images=image_filenames or {}
    if action in ("text_to_video","image_to_video"):
        w["398:364"]["inputs"]["text"]=prompt; w["398:361"]["inputs"]["value"]=fps; w["398:372"]["inputs"]["value"]=width; w["398:360"]["inputs"]["value"]=height; w["398:362"]["inputs"]["value"]=duration; w["398:339"]["inputs"]["noise_seed"]=seed
        if action=="image_to_video":w["input:first_image"]["inputs"]["image"]=images.get("first_image","__FIRST_IMAGE__")
        _set_audio(w,"398:370",["398:358",0],generate_audio)
    elif action=="first_last_frame_to_video":
        w["251:222"]["inputs"]["text"]=prompt; w["251:205"]["inputs"]["value"]=fps; w["251:215"]["inputs"]["value"]=width; w["251:216"]["inputs"]["value"]=height; w["251:198"]["inputs"]["value"]=duration; w["251:196"]["inputs"]["noise_seed"]=seed
        w["input:first_image"]["inputs"]["image"]=images.get("first_image","__FIRST_IMAGE__"); w["input:last_image"]["inputs"]["image"]=images.get("last_image","__LAST_IMAGE__")
        for node in ("251:213","251:214"):w[node]["inputs"]["resize_type"].update(width=width,height=height)
        _set_audio(w,"251:218",["251:220",0],generate_audio)
    else:raise ValueError(f"unsupported action: {action}")
    return w
def validate_workflow_values(w:dict[str,Any],e:dict[str,Any])->None:
    if e["action"] in ("text_to_video","image_to_video"):
        p,wi,he,fp,du,se,out="398:364","398:372","398:360","398:361","398:362","398:339","398:370"; audio=["398:358",0]
        if e["action"]=="image_to_video":assert w["input:first_image"]["inputs"]["image"]==e["first_image"]
    else:
        p,wi,he,fp,du,se,out="251:222","251:215","251:216","251:205","251:198","251:196","251:218"; audio=["251:220",0]
        assert w["input:first_image"]["inputs"]["image"]==e["first_image"]; assert w["input:last_image"]["inputs"]["image"]==e["last_image"]; assert w["251:213"]["inputs"]["resize_type"]["width"]==e["width"]; assert w["251:213"]["inputs"]["resize_type"]["height"]==e["height"]
    assert w[p]["inputs"]["text"]==e["prompt"]; assert w[wi]["inputs"]["value"]==e["width"]; assert w[he]["inputs"]["value"]==e["height"]; assert w[fp]["inputs"]["value"]==e["fps"]; assert w[du]["inputs"]["value"]==e["duration"]; assert w[se]["inputs"]["noise_seed"]==e["seed"]; assert w[out]["inputs"].get("audio")== (audio if e["generate_audio"] else None)
