import zipfile
import os
from collections import Counter

zip_path = r"D:\mini project\garbage-classification.zip"
if os.path.exists(zip_path):
    with zipfile.ZipFile(zip_path, "r") as z:
        names = [n for n in z.namelist() if not n.endswith("/")]
        counts = Counter()
        for n in names:
            parts = n.split("/")
            if len(parts) > 1:
                counts[parts[0] if len(parts) == 2 else parts[1]] += 1
        print(f"Total files in zip: {len(names)}")
        print("Folder counts in zip:")
        for k, v in counts.most_common(20):
            print(f"  {k}: {v}")

cache_asdasdas = r"C:\Users\tmpra\.cache\kagglehub\datasets\asdasdasasdas\garbage-classification\versions\2"
if os.path.exists(cache_asdasdas):
    print("\nFiles in asdasdasasdas dataset:")
    for root, dirs, files in os.walk(cache_asdasdas):
        if files:
            rel = os.path.relpath(root, cache_asdasdas)
            print(f"  {rel}: {len(files)} files")
