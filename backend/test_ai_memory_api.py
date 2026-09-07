from fastapi.testclient import TestClient
from PIL import Image
from io import BytesIO
import json
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from app.main import app
from app.services.ai_vision_service import AIVisionService

client = TestClient(app)

print("--- Testing Advanced Waste AI & Personal AI Memory System ---")

# 1. Test Dense Visual Feature Embedding Extractor
test_img = Image.new('RGB', (120, 240), color=(15, 15, 15)) # Dark portrait rectangle (Mobile Phone form factor)
emb = AIVisionService.extract_image_embedding(test_img)
assert len(emb) == 128, f"Expected 128 dims, got {len(emb)}"
print("[PASS] 1. 128-dimensional dense visual feature embedding extracted successfully")

# 2. Test Multi-Stage Detection with Two-Level Hierarchy
analysis = AIVisionService.detect_and_classify(test_img, filename_hint="my_smartphone_photo.jpg")
assert analysis["predicted_category"] == "E-Waste", f"Expected E-Waste, got {analysis['predicted_category']}"
assert "phone" in analysis["detected_item"].lower(), f"Expected Phone subclass, got {analysis['detected_item']}"
assert "status" in analysis
print(f"[PASS] 2. Two-level classification: Level 1='{analysis['predicted_category']}', Level 2='{analysis['detected_item']}', Confidence={analysis['confidence_pct']}%")

# 3. Authenticate as Admin user
login_resp = client.post("/api/auth/login", json={
    "email": "admin@chennaiswm.gov.in",
    "password": "Admin@123"
})
assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("[PASS] 3. Authenticated session established for user:", login_resp.json()["user"]["full_name"])

# 4. Test Adding an item to Personal AI Memory
# Create sample image buffer
buf = BytesIO()
test_img.save(buf, format="JPEG")
buf.seek(0)

add_mem = client.post(
    "/api/memory/add",
    headers=headers,
    data={
        "confirmed_item": "Mobile Phone",
        "confirmed_waste_category": "E-Waste",
        "notes": "My personal backup smartphone reference"
    },
    files={"file": ("phone_ref.jpg", buf.getvalue(), "image/jpeg")}
)
assert add_mem.status_code == 200, f"Add to memory failed: {add_mem.text}"
ref_id = add_mem.json()["reference_id"]
print(f"[PASS] 4. Item successfully saved to Personal AI Memory (Ref ID: {ref_id})")

# 5. Test Retrieving Personal Memory Items
get_mem = client.get("/api/memory/", headers=headers)
assert get_mem.status_code == 200
items = get_mem.json()
assert len(items) >= 1
print(f"[PASS] 5. Personal AI Memory list retrieved: {len(items)} reference items found")

# 6. Test Live Webcam Detection with Personal AI Memory Matching
buf.seek(0)
detect_resp = client.post(
    "/api/detections/live-detect",
    headers=headers,
    files={"file": ("webcam_phone_frame.jpg", buf.getvalue(), "image/jpeg")}
)
assert detect_resp.status_code == 200, f"Live detect failed: {detect_resp.text}"
det_data = detect_resp.json()
assert det_data["global_detection"]["waste_category"] == "E-Waste"
assert det_data["personal_ai_memory"] is not None
assert det_data["personal_ai_memory"]["has_match"] == True
assert det_data["personal_ai_memory"]["similarity_pct"] >= 70
print(f"[PASS] 6. Live detection personal memory match: {det_data['personal_ai_memory']['explainable_message']}")
print(f"       Combined Verdict: {det_data['combined_verdict']['detected_item']} ({det_data['combined_verdict']['confidence_pct']}%)")

# 7. Test Class Distribution & Imbalance Warnings
dist_resp = client.get("/api/ai-training/class-distribution")
assert dist_resp.status_code == 200
dist_data = dist_resp.json()
assert len(dist_data["underrepresented_warnings"]) > 0
print(f"[PASS] 7. Class Distribution verified with {len(dist_data['underrepresented_warnings'])} imbalance warnings identified (e.g. {dist_data['underrepresented_warnings'][0]})")

# 8. Test Confusion Matrix
cm_resp = client.get("/api/ai-training/confusion-matrix")
assert cm_resp.status_code == 200
cm_data = cm_resp.json()
assert len(cm_data["classes"]) >= 9
assert len(cm_data["critical_confusions"]) >= 5
print(f"[PASS] 8. Confusion Matrix retrieved with {len(cm_data['critical_confusions'])} critical confusion pairs tracked")

# 9. Test Model Comparison with Per-Class Metrics & Acceptance Checks
comp_resp = client.get("/api/models/comparison")
assert comp_resp.status_code == 200
comp_data = comp_resp.json()
cand = comp_data["candidate_model"]
assert cand is not None
assert "acceptance_rules" in cand
assert cand["acceptance_rules"]["all_passed"] == True
print(f"[PASS] 9. Model comparison per-class metrics & acceptance rules verified (Passed: {cand['acceptance_rules']['all_passed']})")

# 10. Clean up test reference
del_resp = client.delete(f"/api/memory/{ref_id}", headers=headers)
assert del_resp.status_code == 200
print("[PASS] 10. Memory item deletion & cleanup verified")

print("\nALL 10 BACKEND ADVANCED AI & PERSONAL MEMORY TESTS PASSED!")