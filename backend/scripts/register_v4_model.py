import os
import sys
import json

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.models.ai_model import AIModelVersion

def register_model():
    metrics_path = os.path.join(backend_dir, "models", "metrics", "v4.0_evaluation.json")
    if not os.path.exists(metrics_path):
        print(f"Error: {metrics_path} does not exist.")
        return

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    db = SessionLocal()
    try:
        # Mark previous active models as inactive
        db.query(AIModelVersion).update({AIModelVersion.is_active_production: False})

        # Register or update v4.0
        m = db.query(AIModelVersion).filter(AIModelVersion.version == "v4.0").first()
        if not m:
            m = AIModelVersion(version="v4.0")
            db.add(m)

        m.model_name = "GCC-WasteVision-MobileNetV3-ExpandedMegaCorpus"
        m.version = "v4.0"
        m.status = "production"
        m.framework = "PyTorch 2.6 / CUDA 12.4 (RTX 3050)"
        m.accuracy = metrics["test_accuracy"]
        m.precision = metrics["macro_precision"]
        m.recall = metrics["macro_recall"]
        m.f1_score = metrics["macro_f1_score"]
        m.dataset_version = "MegaCorpus-v4.0"
        m.class_metrics_json = json.dumps(metrics["per_class"])
        m.is_active_production = True
        m.notes = "Trained on RTX 3050 GPU using MobileNetV3-Large on 25,411-image balanced mega corpus including Akshat103 E-Waste, YadavMohit04 Plastic, Roboflow Detection, PhenomSG, and MostafaAbla."

        if "E-Waste" in metrics["per_class"]:
            ewaste_stat = metrics["per_class"]["E-Waste"]
            m.ewaste_f1 = ewaste_stat["f1_score"]
            m.mobile_phone_recall = ewaste_stat["recall"]
            m.mobile_phone_precision = ewaste_stat["precision"]

        db.commit()
        print(f"Model v4.0 successfully registered in database as ACTIVE PRODUCTION MODEL (Accuracy: {m.accuracy*100:.2f}%)!")
    finally:
        db.close()

if __name__ == "__main__":
    register_model()
