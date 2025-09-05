from fastapi import APIRouter

route = APIRouter(tags=["기본"])

@route.get("/")
def home():
  return {"status": 2}