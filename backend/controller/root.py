from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
import requests
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
load_dotenv()

route = APIRouter(tags=["기본"])
security = HTTPBearer()

ALGORITHM = "RS256"
jwks_cache = None

def get_jwks():
  global jwks_cache
  if jwks_cache is None:
    resp = requests.get(os.getenv('JWKS_URL'))
    resp.raise_for_status()
    jwks_cache = resp.json()
  return jwks_cache

def verify_token(token: str):
  jwks = get_jwks()
  kid = "public-key-id"
  # unverified_header = jwt.get_unverified_header(token)
  # kid = unverified_header.get("kid")
  # if not kid:
  #   raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header")

  key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
  if not key:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Public key not found")
  
  try:
    payload = jwt.decode(token, key, algorithms=[ALGORITHM])
    return payload
  except JWTError:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@route.get("/")
def home():
  return {"status": 2}

@route.get("/token")
def test(token: str = Depends(security)):
  if token:
    payload = verify_token(token.credentials)
    return {"status": True, "userNo": payload["userNo"]}
  else:
    return {"status": False}