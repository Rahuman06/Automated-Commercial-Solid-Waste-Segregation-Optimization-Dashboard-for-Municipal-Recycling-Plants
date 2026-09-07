from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from datetime import datetime
from app.core.database import Base

class AIModelVersion(Base):
    __tablename__ = "ai_models"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, default="GCC-WasteVision-YOLO")
    version = Column(String, unique=True, index=True, nullable=False) # e.g. v2.1, v2.2
    status = Column(String, default="candidate") # production, candidate, archived, training
    framework = Column(String, default="PyTorch 2.2 / YOLOv8-Waste")
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    training_images_count = Column(Integer, default=12000)
    training_date = Column(DateTime, default=datetime.utcnow)
    dataset_version = Column(String, default="GCC-DS-2026.1")
    class_metrics_json = Column(Text) # JSON with per-class F1 & accuracy
    notes = Column(Text)
    is_active_production = Column(Boolean, default=False)

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    id = Column(Integer, primary_key=True, index=True)
    job_code = Column(String, unique=True, index=True)
    candidate_version = Column(String, nullable=False)
    base_version = Column(String, default="v2.1")
    new_images_count = Column(Integer, default=500)
    status = Column(String, default="completed") # queued, running, completed, failed
    current_epoch = Column(Integer, default=50)
    total_epochs = Column(Integer, default=50)
    train_loss = Column(Float, default=0.084)
    val_loss = Column(Float, default=0.112)
    val_accuracy = Column(Float, default=0.921)
    val_f1 = Column(Float, default=0.914)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)
    log_output = Column(Text)
