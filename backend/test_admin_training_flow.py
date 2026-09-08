import os
import sys
import io
import time
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING COMPREHENSIVE BACKEND VERIFICATION ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health check passed:", res.json()["service"])

    # 2. Admin login
    res = client.post("/api/admin/login", json={"email": "ai.lead@chennaiswm.gov.in", "password": "Admin@123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 2. Admin Login successful:", res.json()["user"]["full_name"], f"({res.json()['user']['role']})")

    # Verify non-admin role rejection
    res_non_admin = client.post("/api/admin/login", json={"email": "priya.chennai@gmail.com", "password": "Citizen@123"})
    assert res_non_admin.status_code == 403, f"Non-admin was not rejected: {res_non_admin.status_code}"
    print("[PASS] 2b. Role-based security verified: Non-admin rejected with 403 Forbidden.")

    # 3. Admin Overview
    res = client.get("/api/admin/overview", headers=admin_headers)
    assert res.status_code == 200, f"Admin overview failed: {res.text}"
    metrics = res.json()["metrics"]
    print("[PASS] 3. Admin Overview KPI metrics:", metrics)

    # 4. User Image Upload
    # Create test JPEG in memory
    img = Image.new("RGB", (200, 200), color=(120, 40, 180))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    files = {"file": ("test_phone_photo.jpg", img_bytes, "image/jpeg")}
    data = {
        "object_label": "Broken Mobile Phone",
        "category": "E-Waste",
        "description": "User uploaded smartphone with shattered glass.",
        "location_context": "Anna Nagar Roundtana, Chennai"
    }
    res = client.post("/api/uploads/", files=files, data=data)
    assert res.status_code == 201, f"User upload failed: {res.text}"
    upload_info = res.json()["upload"]
    new_upload_id = upload_info["id"]
    print(f"[PASS] 4. User Image Uploaded successfully. ID: {new_upload_id}, Status: {upload_info['status']}")

    # 5. List Pending Uploads in Admin Queue
    res = client.get("/api/admin/uploads?status_filter=PENDING_VERIFICATION", headers=admin_headers)
    assert res.status_code == 200
    pending_list = res.json()["uploads"]
    assert any(u["id"] == new_upload_id for u in pending_list)
    print(f"[PASS] 5. Upload appears in Admin Verification Queue (Total pending: {len(pending_list)}).")

    # 6. Admin Verification: Approve with label/category correction
    approve_payload = {
        "verified_category": "E-Waste",
        "verified_label": "Mobile Phone (Smartphone)",
        "admin_notes": "Verified authentic smartphone component. Corrected label to standardized taxonomy."
    }
    res = client.put(f"/api/admin/uploads/{new_upload_id}/approve", json=approve_payload, headers=admin_headers)
    assert res.status_code == 200, f"Approval failed: {res.text}"
    print("[PASS] 6. Admin Verification Approved & Added to Dataset:", res.json()["message"])

    # 7. Verified Dataset Query
    res = client.get("/api/admin/dataset", headers=admin_headers)
    assert res.status_code == 200
    ds_data = res.json()
    print(f"[PASS] 7. Verified Dataset retrieved. Total items: {ds_data['total_dataset_count']}. Category counts: {ds_data['category_counts']}")

    # 8. Dataset Export (JSON and CSV)
    res_json = client.get("/api/admin/dataset/export?format=json", headers=admin_headers)
    assert res_json.status_code == 200
    assert "records" in res_json.json()

    res_csv = client.get("/api/admin/dataset/export?format=csv", headers=admin_headers)
    assert res_csv.status_code == 200
    assert "dataset_code,waste_category" in res_csv.text
    print("[PASS] 8. Dataset Export to JSON and CSV verified.")

    # 9. Real AI Model Training Trigger
    res = client.post("/api/admin/train-model", json={"candidate_version": "v2.2", "total_epochs": 5}, headers=admin_headers)
    assert res.status_code == 200, f"Training trigger failed: {res.text}"
    print("[PASS] 9. Real AI Model Training Started:", res.json()["message"])

    # 10. Poll Training Status
    time.sleep(2)
    res = client.get("/api/admin/training-status", headers=admin_headers)
    assert res.status_code == 200
    training_status = res.json()
    print(f"[PASS] 10. Training Telemetry: Stage={training_status['stage']}, Progress={training_status['progress_pct']}%, Epoch={training_status['current_epoch']}/{training_status['total_epochs']}")

    # 11. Model Versions Registry
    res = client.get("/api/admin/models", headers=admin_headers)
    assert res.status_code == 200
    models_list = res.json()["models"]
    print(f"[PASS] 11. Model Registry retrieved ({len(models_list)} versions registered).")

    # 12. Activate Model
    target_model_id = models_list[0]["id"]
    res = client.post(f"/api/admin/models/{target_model_id}/activate", headers=admin_headers)
    assert res.status_code == 200
    print("[PASS] 12. Model activated successfully:", res.json()["message"])

    # 13. Public Active Model Endpoint
    res = client.get("/api/admin/models/active")
    assert res.status_code == 200
    active_m = res.json()
    print(f"[PASS] 13. Active Model: {active_m['model_name']} ({active_m['version']}), Accuracy: {active_m['accuracy']*100:.1f}%")

    # 14. Real-time Webcam Detection Inference POST /api/detect
    detect_files = {"file": ("webcam_sample.jpg", img_bytes, "image/jpeg")}
    res = client.post("/api/detect", files=detect_files)
    assert res.status_code == 200, f"Detect failed: {res.text}"
    det_out = res.json()
    print("[PASS] 14. Real-time inference POST /api/detect successful:")
    print("     Active Model:", det_out["model"]["name"], f"({det_out['model']['version']})")
    print("     Detected Item:", det_out["detected_item"])
    print("     Waste Category:", det_out["waste_category"])
    print("     Confidence:", det_out["confidence_pct"], "%")
    print("     Bounding Box:", det_out["bounding_box"])
    print("     Category Color:", det_out["color"])

    print("\n=== ALL 14 BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
