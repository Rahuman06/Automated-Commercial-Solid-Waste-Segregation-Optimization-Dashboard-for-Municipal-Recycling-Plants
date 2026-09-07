from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.data_connector_service import DataConnectorService

router = APIRouter(prefix="/datasets", tags=["Dataset Management & Connectors"])

@router.get("/catalog")
def get_sources():
    return DataConnectorService.get_catalog()

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    source_name: str = Form("Custom Municipal Upload")
):
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files supported for automated schema normalization.")
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    result = DataConnectorService.normalize_csv_content(text)
    return result
