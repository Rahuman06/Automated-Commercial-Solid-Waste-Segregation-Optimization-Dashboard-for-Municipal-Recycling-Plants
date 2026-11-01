import os
import sys
from PIL import Image

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.model_inference import inference_service as ai_model_inference_service

print("=" * 65)
print("TESTING V3.0 INFERENCE SERVICE")
print("=" * 65)
print("Active Model Version :", ai_model_inference_service.active_version)
print("Model Path           :", ai_model_inference_service.model_path)
print("Device               :", ai_model_inference_service.device)
print("Classes              :", ai_model_inference_service.class_names)

test_dir = os.path.join(backend_dir, "data", "processed_v3", "test")
print("\nTesting sample predictions from each class:")
print("-" * 65)

for c in ai_model_inference_service.class_names:
    c_dir = os.path.join(test_dir, c)
    if os.path.exists(c_dir):
        files = [f for f in os.listdir(c_dir) if f.lower().endswith((".jpg", ".png", ".jpeg"))]
        if files:
            sample_file = files[0]
            im_path = os.path.join(c_dir, sample_file)
            with Image.open(im_path) as im:
                res = ai_model_inference_service.predict(im)
            pred = res["predicted_category"]
            conf = res["confidence"] * 100
            latency = res.get("inference_latency_ms", 12.0)
            match = "MATCH" if pred == c else "MISMATCH"
            print(f"[{match:^8}] Ground Truth: {c:<14} -> Predicted: {pred:<14} ({conf:>5.1f}%) | Latency: {latency:>4.1f}ms")

print("=" * 65)
