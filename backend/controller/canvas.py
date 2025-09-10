from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel
from config.db import getConn
import mariadb
import os

route = APIRouter(tags=["캔버스 드로잉"])

class Canvas(BaseModel):
  userNo: int
  name: str
  draft: str

@route.post("/canvas/{no}")
def findAll(no: int):
  try:
    conn = getConn()
    cur = conn.cursor()
    
    sql = f'''
          SELECT `no`, `name`, `draft`
            FROM gotham.`canvas`
          WHERE useYn = 'Y'
            AND regUserNo = {no}
    '''
    cur.execute(sql)
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    result = None
    if rows:
      result = [dict(zip(columns, row)) for row in rows]
    else :
      result = []
    return {"status": True, "result" : result}
  except mariadb.Error as e:
    print(f"MariaDB 오류 발생: {e}")
    return {"status": False}
  
@route.put("/canvas")
def insert(canvas: Canvas):
  try:
    conn = getConn()
    cur = conn.cursor()
    
    sql = f'''
          INSERT INTO gotham.`canvas`
            (`name`, `draft`, `useYn`, `regUserNo`)
          VALUE 
            ('{canvas.name}', '{canvas.draft}', 'Y', {canvas.userNo})  
    '''
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    return {"status": True}
  except mariadb.Error as e:
    print(f"MariaDB 오류 발생: {e}")
    return {"status": False}
