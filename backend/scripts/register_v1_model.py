import os
import sys
import json

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.models.ai_model import AIModelVersion

def register_model():
    metrics_path = os.path.join(backend_dir, "models", "metrics", "v1.0_evaluation.json")
    if not os.path.exists(metrics_path):
        print(f"Error: {metrics_path} does not exist.")
        return

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    db = SessionLocal()
    try:
        # Set previous active models to inactive
        db.query(AIModelVersion).update({AIModelVersion.is_active_production: False})

        # Register or update v1.0
        m = db.query(AIModelVersion).filter(AIModelVersion.version == "v1.0").first()
        if not m:
            m = AIModelVersion(version="v1.0")
            db.add(m)

        m.model_name = "GCC-WasteVision-MobileNetV3"
        m.version = "v1.0"
        m.status = "production"
        m.framework = "PyTorch 2.6 / CUDA 12.4 (RTX 3050)"
        m.accuracy = metrics["metrics"]["test_accuracy"]
        m.precision = metrics["metrics"]["macro_precision"]
        m.recall = metrics["metrics"]["macro_recall"]
        m.f1_score = metrics["metrics"]["macro_f1_score"]
        m.training_images_count = 5246
        m.dataset_version = "GCC-Waste-v1.0"
        m.class_metrics_json = json.dumps(metrics["per_class_metrics"])
        m.is_active_production = True
        m.notes = "Trained on RTX 3050 GPU using MobileNetV3-Large transfer learning on 7 solid waste classes."
        
        ewaste_stat = next((c for c in metrics["per_class_metrics"] if c["class_name"] == "E-Waste"), None)
        if ewaste_stat:
            m.ewaste_f1 = ewaste_stat["f1_score"]
            m.mobile_phone_recall = ewaste_stat["recall"]
            m.mobile_phone_precision = ewaste_stat["precision"]

        db.commit()
        print("Model v1.0 successfully registered in database as ACTIVE PRODUCTION MODEL (Accuracy: 95.74%)!")
    finally:
        db.close()

if __name__ == "__main__":
    register_model()
