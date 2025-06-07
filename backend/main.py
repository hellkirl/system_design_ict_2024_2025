import os
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tasks import process_file
import uuid, json

app = FastAPI(title="Big Data Lab 9")

BASE_DIR = "/data"
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
RESULT_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload/")
async def upload(file: UploadFile):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only .csv allowed")
    file_id = f"{uuid.uuid4()}.csv"
    dest = os.path.join(UPLOAD_DIR, file_id)
    with open(dest, "wb") as f:
        f.write(await file.read())
    process_file.delay(file_id)
    return {"status": "processing", "file_id": file_id}


@app.get("/status/{file_id}")
def status(file_id: str):
    result_path = os.path.join(RESULT_DIR, file_id.replace(".csv", ".json"))
    if os.path.exists(result_path):
        return {"file_id": file_id, "status": "done"}
    else:
        return {"file_id": file_id, "status": "running"}


@app.get("/results/{file_id}")
def results(file_id: str):
    path = os.path.join(RESULT_DIR, file_id.replace(".csv", ".json"))
    if not os.path.exists(path):
        raise HTTPException(404, "Results not ready")

    with open(path, "r") as f:
        content = f.read()
    return json.loads(content)
