import os
import io
import json
import random
import hashlib
import zipfile
from collections import defaultdict
from PIL import Image

# Configuration
ZIP_PATH = r"D:\mini project\garbage-classification.zip"
TARGET_DIR = r"D:\mini project\final product\website\backend\data\processed"
SEED = 42

# Category mapping from zip folder to project category
CATEGORY_MAPPING = {
    "biological": "Biodegradable",
    "cardboard": "Cardboard",
    "paper": "Paper",
    "plastic": "Plastic",
    "metal": "Metal",
    "white-glass": "Glass",
    "green-glass": "Glass",
    "brown-glass": "Glass",
    "battery": "E-Waste"
}

def prepare_dataset():
    random.seed(SEED)
    print(f"Opening archive: {ZIP_PATH}...")
    
    if not os.path.exists(ZIP_PATH):
        raise FileNotFoundError(f"Dataset archive not found: {ZIP_PATH}")
        
    os.makedirs(TARGET_DIR, exist_ok=True)
    for split in ["train", "val", "test"]:
        for cat in set(CATEGORY_MAPPING.values()):
            os.makedirs(os.path.join(TARGET_DIR, split, cat), exist_ok=True)

    seen_hashes = set()
    category_files = defaultdict(list)
    corrupted_count = 0
    duplicate_count = 0
    total_scanned = 0

    with zipfile.ZipFile(ZIP_PATH, "r") as z:
        for file_info in z.infolist():
            if file_info.is_dir():
                continue
            name = file_info.filename
            if not name.lower().endswith((".jpg", ".jpeg", ".png")):
                continue

            parts = name.split("/")
            if len(parts) < 3:
                continue
            source_folder = parts[1].lower()
            if source_folder not in CATEGORY_MAPPING:
                continue
            
            target_category = CATEGORY_MAPPING[source_folder]
            total_scanned += 1
            
            # Read and validate image
            try:
                data = z.read(name)
                # Duplicate detection via hash
                h = hashlib.sha256(data).hexdigest()
                if h in seen_hashes:
                    duplicate_count += 1
                    continue
                seen_hashes.add(h)

                # Verify image can be opened and parsed
                with Image.open(io.BytesIO(data)) as img:
                    img.verify()
                
                # Store valid item
                category_files[target_category].append((name, data))
            except Exception as e:
                corrupted_count += 1

    print(f"Scanned {total_scanned} candidate images.")
    print(f"Duplicates filtered: {duplicate_count}, Corrupted filtered: {corrupted_count}")
    print("Class distribution after validation:")
    
    split_counts = {"train": defaultdict(int), "val": defaultdict(int), "test": defaultdict(int)}
    total_saved = 0

    for cat, items in category_files.items():
        random.shuffle(items)
        n = len(items)
        train_end = int(n * 0.70)
        val_end = int(n * 0.85)

        train_items = items[:train_end]
        val_items = items[train_end:val_end]
        test_items = items[val_end:]

        print(f"  {cat}: Total={n} (Train={len(train_items)}, Val={len(val_items)}, Test={len(test_items)})")

        splits_data = [
            ("train", train_items),
            ("val", val_items),
            ("test", test_items)
        ]

        for split_name, split_list in splits_data:
            dest_dir = os.path.join(TARGET_DIR, split_name, cat)
            for idx, (orig_name, img_bytes) in enumerate(split_list):
                ext = os.path.splitext(orig_name)[1].lower()
                out_name = f"{cat.lower()}_{idx:05d}{ext}"
                out_path = os.path.join(dest_dir, out_name)
                with open(out_path, "wb") as f:
                    f.write(img_bytes)
                split_counts[split_name][cat] += 1
                total_saved += 1

    summary = {
        "dataset_name": "GCC Municipal Solid Waste Classification Dataset v1.0",
        "total_images": total_saved,
        "classes": sorted(list(set(CATEGORY_MAPPING.values()))),
        "class_count": len(set(CATEGORY_MAPPING.values())),
        "split_ratio": {"train": 0.70, "val": 0.15, "test": 0.15},
        "splits": {
            "train": dict(split_counts["train"]),
            "val": dict(split_counts["val"]),
            "test": dict(split_counts["test"])
        },
        "duplicates_removed": duplicate_count,
        "corrupted_removed": corrupted_count
    }

    summary_path = os.path.join(TARGET_DIR, "dataset_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nDataset preparation complete! Total saved images: {total_saved}")
    print(f"Summary written to: {summary_path}")

if __name__ == "__main__":
    prepare_dataset()
