import requests, os

test_base = "data/processed_v2/test"
for cat in ["Biodegradable", "Cardboard", "Glass", "Metal", "Paper", "Plastic"]:
    cat_dir = os.path.join(test_base, cat)
    if os.path.exists(cat_dir):
        files = [f for f in os.listdir(cat_dir) if f.endswith((".jpg", ".png"))]
        if files:
            with open(os.path.join(cat_dir, files[0]), "rb") as f:
                res = requests.post("http://127.0.0.1:8000/api/detect", files={"file": (f"{cat}.jpg", f, "image/jpeg")})
            if res.status_code == 200:
                d = res.json()
                print(f"{cat:<15} --> Detected: {d['detected_item']} ({d['waste_category']}) {d['confidence_pct']}% Box: {d['bounding_box']}")
            else:
                print(f"{cat} failed with {res.status_code}")
