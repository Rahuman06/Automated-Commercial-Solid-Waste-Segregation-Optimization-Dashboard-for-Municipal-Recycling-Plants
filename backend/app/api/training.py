from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.training_service import TrainingService

router = APIRouter(prefix="/ai-training", tags=["Continuous AI Retraining Pipeline"])

@router.get("/status")
def get_training_status(db: Session = Depends(get_db)):
    return TrainingService.get_training_progress(db)

@router.post("/trigger-retraining")
def trigger_retraining(force: bool = Form(False), db: Session = Depends(get_db)):
    result = TrainingService.trigger_retraining(db, force=force)
    return result

@router.get("/class-distribution")
def get_class_distribution():
    return TrainingService.get_class_distribution()

@router.get("/confusion-matrix")
def get_confusion_matrix():
    return TrainingService.get_confusion_matrix()
