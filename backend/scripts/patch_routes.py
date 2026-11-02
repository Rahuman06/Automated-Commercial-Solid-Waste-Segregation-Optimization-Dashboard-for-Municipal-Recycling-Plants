import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def patch_file(rel_path, old_pattern, new_pattern):
    full_path = os.path.join(base_dir, rel_path)
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully patched {rel_path}")
    else:
        print(f"Pattern not found in {rel_path}")

patch_file("app/api/detections.py", '@router.get("/", response_model=List[AIDetectionSchema])', '@router.get("", response_model=List[AIDetectionSchema])\n@router.get("/", response_model=List[AIDetectionSchema], include_in_schema=False)')
patch_file("app/api/wards.py", '@router.get("/", response_model=List[WardSummary])', '@router.get("", response_model=List[WardSummary])\n@router.get("/", response_model=List[WardSummary], include_in_schema=False)')
patch_file("app/api/vehicles.py", '@router.get("/", response_model=List[VehicleSchema])', '@router.get("", response_model=List[VehicleSchema])\n@router.get("/", response_model=List[VehicleSchema], include_in_schema=False)')
patch_file("app/api/plants.py", '@router.get("/", response_model=List[PlantSchema])', '@router.get("", response_model=List[PlantSchema])\n@router.get("/", response_model=List[PlantSchema], include_in_schema=False)')

frontend_dir = os.path.join(os.path.dirname(base_dir), "frontend")
def patch_frontend(rel_path, old_pattern, new_pattern):
    full_path = os.path.join(frontend_dir, rel_path)
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully patched {rel_path}")
    else:
        print(f"Pattern not found in {rel_path}")

patch_frontend("lib/api.ts", "`/wards/?${params.toString()}`", "`/wards?${params.toString()}`")
patch_frontend("lib/api.ts", "fetchApi<any[]>(\"/vehicles/\")", "fetchApi<any[]>(\"/vehicles\")")
patch_frontend("lib/api.ts", "`/detections/?${params.toString()}`", "`/detections?${params.toString()}`")
patch_frontend("components/LayoutWrapper.tsx", "Model Version: YOLO-v2.1 Production", "Model Version: v5.0 Production (MobileNetV3)")
