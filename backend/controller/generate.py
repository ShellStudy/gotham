from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db import getConn
import json
from urllib import request
import asyncio
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
load_dotenv()

COMFYUI_URL = os.getenv('COMFYUI_URL')
route = APIRouter(tags=["이미지 생성"])

class Prompt(BaseModel):
  p : str
  no : int

@route.post("/gen")
async def comfyUI(prompt : Prompt):
  try:  
    # p = "a majestic lion with a crown of stars, photorealistic"
    with open("flow/1.json", "r", encoding="utf-8") as f:
      workflow = json.load(f)
    workflow["6"]["inputs"]["text"] = prompt.p

    prompt_id = queue_prompt(workflow)
    result = await check_progress(prompt_id)
    
    final_image_url = None
    origin_name = None
    file_name = None
    file_path = None
    now = datetime.now()
    formatted_date = now.strftime("%Y%m%d")
    path = f"images/{formatted_date}"
    if not os.path.exists(path):
      os.makedirs(path)
    for node_id, node_output in result['outputs'].items():
      if 'images' in node_output:
        for image in node_output['images']:
          final_image_url = f"http://{COMFYUI_URL}/api/view?filename={image['filename']}&type=output&subfolder="
          origin_name = image['filename'].replace(".png", "")
          file_name = uuid.uuid1().hex
          file_path = f"{path}/{file_name}.png"
          request.urlretrieve(final_image_url, file_path)
    
    if final_image_url:
      if file_name:
        conn = getConn()
        cur = conn.cursor()
        sql = f'''
              INSERT INTO auth.file 
              (`origin`, `name`, `ext`, `mediaType`, `attachPath`, `useYn`, `regUserNo`) 
              VALUE 
              ('{origin_name}', '{file_name}', '.png', 'image/png', '{file_path}', 'Y', {prompt.no})
        '''
        cur.execute(sql)
        conn.commit()
        last_id = cur.lastrowid
        print(last_id)
        
        p = prompt.p.replace("\'", "\"")
        
        sql = f'''
              INSERT INTO pixel.`board`
              (`prompt`, `fileNo`, `useYn`, `regUserNo`) 
              VALUE 
              ('{p}', {last_id}, 'Y', {prompt.no})
        '''
        cur.execute(sql)
        
        conn.commit()
        cur.close()
        conn.close()
        return {"status": True}
    else:
      return {"status": False}
  except HTTPException as e:
    raise e
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

def queue_prompt(prompt_workflow):
  p = {"prompt": prompt_workflow}
  data = json.dumps(p).encode('utf-8')
  req = request.Request(f"http://{COMFYUI_URL}/prompt", data=data)
  try:
    res = request.urlopen(req)
    if res.code != 200:
      raise Exception(f"Error: {res.code} {res.reason}")
    return json.loads(res.read().decode('utf-8'))['prompt_id']
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

async def check_progress(prompt_id: str):
  while True:
    try:
      req = request.Request(f"http://{COMFYUI_URL}/history/{prompt_id}")
      res = request.urlopen(req)
      if res.code == 200:
        history = json.loads(res.read().decode('utf-8'))
        if prompt_id in history:
          return history[prompt_id]
    except Exception as e:
      print(f"Error checking progress: {str(e)}")
    await asyncio.sleep(1)
