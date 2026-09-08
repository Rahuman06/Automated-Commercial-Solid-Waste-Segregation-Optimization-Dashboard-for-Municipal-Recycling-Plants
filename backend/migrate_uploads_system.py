import os
import sys
import json
import random
from datetime import datetime, timedelta

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.models.upload import Upload, DatasetImage
from app.models.ai_model import AIModelVersion, TrainingJob
from app.models.user import User
from app.core.security import hash_password

from sqlalchemy import text

def add_column_if_not_exists(conn, table, column, col_type):
    try:
        res = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        col_names = [r[1] for r in res]
        if column not in col_names:
            print(f"Adding column {column} to table {table}...")
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            conn.commit()
    except Exception as e:
        print(f"Error checking column {column}: {e}")

def run_migration():
    print("Ensuring columns exist in database...")
    with engine.connect() as conn:
        add_column_if_not_exists(conn, "ai_models", "mobile_phone_recall", "FLOAT DEFAULT 0.91")
        add_column_if_not_exists(conn, "ai_models", "mobile_phone_precision", "FLOAT DEFAULT 0.93")
        add_column_if_not_exists(conn, "ai_models", "ewaste_f1", "FLOAT DEFAULT 0.92")
        add_column_if_not_exists(conn, "training_jobs", "stage", "VARCHAR DEFAULT 'completed'")
        add_column_if_not_exists(conn, "training_jobs", "progress_pct", "FLOAT DEFAULT 100.0")
        add_column_if_not_exists(conn, "training_jobs", "precision", "FLOAT DEFAULT 0.918")
        add_column_if_not_exists(conn, "training_jobs", "recall", "FLOAT DEFAULT 0.912")
        add_column_if_not_exists(conn, "training_jobs", "error_message", "TEXT")

    print("Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # 1. Verify / Create Admin Users
        admin_user = db.query(User).filter(User.username == "ai_admin").first()
        if not admin_user:
            admin_user = User(
                username="ai_admin",
                email="ai.lead@chennaiswm.gov.in",
                hashed_password=hash_password("Admin@123"),
                full_name="Dr. Ananya Natarajan (Lead AI Scientist)",
                role="ai_admin",
                organization="IIT Madras / GCC AI Lab",
                city="Chennai",
                contribution_points=2400,
                badges="AI Vision Lead"
            )
            db.add(admin_user)

        sys_admin = db.query(User).filter(User.username == "admin").first()
        if not sys_admin:
            sys_admin = User(
                username="admin",
                email="admin@chennaiswm.gov.in",
                hashed_password=hash_password("Admin@123"),
                full_name="Dr. M. Soundararajan, IAS (Municipal Commissioner)",
                role="system_admin",
                organization="Greater Chennai Corporation (GCC)",
                city="Chennai",
                contribution_points=1250,
                badges="Municipal Director"
            )
            db.add(sys_admin)

        citizen = db.query(User).filter(User.username == "citizen_priya").first()
        if not citizen:
            citizen = User(
                username="citizen_priya",
                email="priya.chennai@gmail.com",
                hashed_password=hash_password("Citizen@123"),
                full_name="Priya Subramanian (Green Volunteer)",
                role="contributor",
                organization="Chennai Green Earth Citizens Club",
                city="Chennai",
                contribution_points=420,
                badges="Master Segregator"
            )
            db.add(citizen)
        db.commit()

        # 2. Seed Initial Model Versions if needed
        model_count = db.query(AIModelVersion).count()
        if model_count == 0:
            print("Seeding baseline AI Model Versions...")
            v1 = AIModelVersion(
                model_name="Waste Detection Model v1",
                version="v1.0",
                status="archived",
                framework="PyTorch 2.0 / YOLOv5-Waste",
                accuracy=0.842,
                precision=0.825,
                recall=0.810,
                f1_score=0.817,
                training_images_count=8500,
                training_date=datetime.utcnow() - timedelta(days=90),
                dataset_version="GCC-DS-2025.1",
                class_metrics_json=json.dumps([
                    {"class_name": "Plastic", "precision": 0.89, "recall": 0.86, "f1_score": 0.875},
                    {"class_name": "Paper", "precision": 0.88, "recall": 0.85, "f1_score": 0.865},
                    {"class_name": "Metal", "precision": 0.84, "recall": 0.80, "f1_score": 0.820},
                    {"class_name": "Organic Waste", "precision": 0.86, "recall": 0.82, "f1_score": 0.840},
                    {"class_name": "E-Waste", "precision": 0.72, "recall": 0.68, "f1_score": 0.700}
                ]),
                notes="Initial municipal baseline model trained on primary solid waste streams.",
                is_active_production=False,
                mobile_phone_recall=0.68,
                mobile_phone_precision=0.72,
                ewaste_f1=0.70
            )
            v2 = AIModelVersion(
                model_name="Waste Detection Model v2",
                version="v2.0",
                status="archived",
                framework="PyTorch 2.1 / YOLOv8m-Waste",
                accuracy=0.894,
                precision=0.882,
                recall=0.865,
                f1_score=0.873,
                training_images_count=12400,
                training_date=datetime.utcnow() - timedelta(days=30),
                dataset_version="GCC-DS-2026.1",
                class_metrics_json=json.dumps([
                    {"class_name": "Plastic", "precision": 0.94, "recall": 0.92, "f1_score": 0.930},
                    {"class_name": "Paper", "precision": 0.95, "recall": 0.93, "f1_score": 0.940},
                    {"class_name": "Metal", "precision": 0.92, "recall": 0.89, "f1_score": 0.905},
                    {"class_name": "Glass", "precision": 0.91, "recall": 0.88, "f1_score": 0.895},
                    {"class_name": "Organic Waste", "precision": 0.91, "recall": 0.89, "f1_score": 0.900},
                    {"class_name": "E-Waste", "precision": 0.86, "recall": 0.83, "f1_score": 0.845},
                    {"class_name": "Mobile Phone", "precision": 0.86, "recall": 0.83, "f1_score": 0.845}
                ]),
                notes="Intermediate model version with expanded E-Waste classes.",
                is_active_production=False,
                mobile_phone_recall=0.83,
                mobile_phone_precision=0.86,
                ewaste_f1=0.845
            )
            v2_1 = AIModelVersion(
                model_name="Waste Detection Model v2.1",
                version="v2.1",
                status="production",
                framework="PyTorch 2.2 / YOLOv8x-Waste",
                accuracy=0.918,
                precision=0.912,
                recall=0.898,
                f1_score=0.905,
                training_images_count=14200,
                training_date=datetime.utcnow() - timedelta(days=7),
                dataset_version="GCC-DS-2026.2",
                class_metrics_json=json.dumps([
                    {"class_name": "Mobile Phone", "precision": 0.92, "recall": 0.90, "f1_score": 0.910},
                    {"class_name": "Battery", "precision": 0.90, "recall": 0.87, "f1_score": 0.885},
                    {"class_name": "Charger & Cable", "precision": 0.89, "recall": 0.86, "f1_score": 0.875},
                    {"class_name": "Circuit Board", "precision": 0.94, "recall": 0.91, "f1_score": 0.925},
                    {"class_name": "Plastic", "precision": 0.95, "recall": 0.94, "f1_score": 0.945},
                    {"class_name": "Paper", "precision": 0.96, "recall": 0.94, "f1_score": 0.950},
                    {"class_name": "Metal", "precision": 0.93, "recall": 0.90, "f1_score": 0.915},
                    {"class_name": "Glass", "precision": 0.93, "recall": 0.90, "f1_score": 0.915},
                    {"class_name": "Organic Waste", "precision": 0.92, "recall": 0.91, "f1_score": 0.915}
                ]),
                notes="Active production model deployed across Greater Chennai Corporation collection trucks and live webcam inference.",
                is_active_production=True,
                mobile_phone_recall=0.90,
                mobile_phone_precision=0.92,
                ewaste_f1=0.910
            )
            db.add_all([v1, v2, v2_1])
            db.commit()
            print("Model versions seeded.")

        # 3. Seed Verified Dataset Images across all 10 categories
        dataset_count = db.query(DatasetImage).count()
        if dataset_count == 0:
            print("Seeding initial verified municipal dataset images...")
            sample_dataset_items = [
                # Mobile Phone & E-Waste
                ("Mobile Phone", "E-Waste", "Discarded Touchscreen Smartphone (Broken Screen)", "Anna Nagar East Community Bin", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop"),
                ("Mobile Phone", "Mobile Phone", "Feature Phone Keypad Device (Obsolete 2G)", "T. Nagar Commercial Center", "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop"),
                ("Battery", "Battery", "Lithium-Ion Rechargeable Phone Battery (Pouch cell)", "Velachery Collection Kiosk", "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop"),
                ("Battery", "Battery", "Alkaline AA Batteries (Corroded contacts)", "Mylapore Residential Area", "https://images.unsplash.com/photo-1584679109597-c656b19974c9?w=600&auto=format&fit=crop"),
                ("Electronic Components", "Electronic Components", "Green FR4 Printed Circuit Board (SMD Components)", "Sholinganallur IT Park MRF", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop"),
                ("Electronic Components", "E-Waste", "Computer Motherboard with Heatsink", "Royapuram E-Waste Hub", "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop"),
                ("Charger & Cable", "E-Waste", "USB-C Fast Charging Adapter with Cable", "Guindy Industrial Estate", "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop"),
                ("Laptop", "E-Waste", "Defunct Ultrabook Laptop with Removed Battery", "Adyar Kasturba Nagar", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop"),
                ("Keyboard & Mouse", "E-Waste", "Wired Membrane Keyboard with USB Connector", "Kodambakkam Electronic Shop", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop"),

                # Plastic
                ("Plastic Bottle", "Plastic", "Clear PET Water Bottle (Crushed, 1 Litre)", "Besant Nagar Beach Promenade", "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop"),
                ("HDPE Container", "Plastic", "Opaque White Milk / Detergent Jug (HDPE 2)", "Kilpauk Garden Colony", "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop"),
                ("Plastic Packaging", "Plastic", "Single-Use LDPE Wrappers and Food Packets", "Koyambedu Wholesale Market", "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=600&auto=format&fit=crop"),

                # Paper
                ("Corrugated Box", "Paper", "Brown Kraft Cardboard Shipping Carton (Baled)", "George Town Commercial Hub", "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop"),
                ("Newspaper", "Paper", "Daily Newspaper Stack (Clean, Dry Pulp Grade)", "Triplicane Resident Society", "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop"),
                ("Office Stationery", "Paper", "Shredded White Printing Paper Sheets", "Nungambakkam High Road", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop"),

                # Metal
                ("Aluminum Can", "Metal", "Pressed Aluminum Soda Beverage Can", "Marina Beach Service Lane", "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop"),
                ("Tin Container", "Metal", "Tinplate Biscuit Box and Steel Can Lid", "Perambur Railway Quarters", "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop"),
                ("Copper Wire Scrap", "Metal", "Stripped Electrical Copper Wiring Offcuts", "Ambattur Industrial Estate", "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop"),

                # Glass
                ("Glass Bottle (Clear)", "Glass", "Transparent Flint Beverage Glass Bottle", "Alwarpet TTK Road", "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop"),
                ("Amber Glass Jar", "Glass", "Amber Medicinal Glass Phial & Culinary Jar", "Shenoy Nagar Community Center", "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop"),

                # Organic Waste
                ("Vegetable Scraps", "Organic Waste", "Culinary Peelings, Tomato & Onion Trimmings", "Koyambedu Bio-CNG Feeder", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop"),
                ("Garden Trimmings", "Organic Waste", "Pruned Tree Leaves and Banana Plantain Waste", "Chetpet Micro Composting Yard", "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop"),

                # Other Waste
                ("Cotton Fabric Scraps", "Other Waste", "Post-Consumer Tailoring Fabric Offcuts", "Washermanpet Textile Ward", "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=600&auto=format&fit=crop"),
                ("Ceramic Tile Shards", "Other Waste", "Inert Demolition Tile & Porcelain Fragment", "Madhavaram Transfer Station", "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop")
            ]

            splits = ["train", "train", "train", "val", "test"]
            for i, (label, cat, desc, loc, img_url) in enumerate(sample_dataset_items):
                ds_item = DatasetImage(
                    dataset_code=f"DS-IMG-2026-{i+1:04d}",
                    image_url=img_url,
                    stored_image_path=img_url,
                    waste_category=cat,
                    object_label=label,
                    description=desc,
                    location_context=loc,
                    split=splits[i % len(splits)],
                    verified_by="Dr. Ananya Natarajan (Lead AI Scientist)",
                    verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 14)),
                    used_in_training=True
                )
                db.add(ds_item)
            db.commit()
            print(f"Seeded {len(sample_dataset_items)} verified dataset images.")

        # 4. Seed User Uploads (Pending, Approved, Rejected)
        upload_count = db.query(Upload).count()
        if upload_count == 0:
            print("Seeding sample user uploads...")
            sample_uploads = [
                # Pending Verifications for Admin Queue
                {
                    "user_name": "Priya Subramanian",
                    "user_email": "priya.chennai@gmail.com",
                    "original_filename": "broken_smartphone_display.jpg",
                    "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop",
                    "category": "Plastic", # Intentionally user misclassified! Perfect for Admin to correct to E-Waste
                    "object_label": "Mobile Phone",
                    "description": "Old black smartphone with shattered screen found in society dry waste bin.",
                    "location_context": "Anna Nagar 2nd Avenue, Chennai",
                    "status": "PENDING_VERIFICATION",
                    "ai_predicted_category": "E-Waste",
                    "ai_predicted_label": "Mobile Phone",
                    "ai_confidence": 0.93
                },
                {
                    "user_name": "R. Vignesh",
                    "user_email": "vignesh.r@gmail.com",
                    "original_filename": "swollen_power_bank.jpg",
                    "image_url": "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop",
                    "category": "E-Waste",
                    "object_label": "Power Bank / Battery",
                    "description": "Lithium-ion power bank swollen casing, left near electronic drop-box.",
                    "location_context": "OMR Sholinganallur Junction",
                    "status": "PENDING_VERIFICATION",
                    "ai_predicted_category": "Battery",
                    "ai_predicted_label": "Power Bank",
                    "ai_confidence": 0.89
                },
                {
                    "user_name": "Kavitha Narayanan",
                    "user_email": "kavitha.n@outlook.com",
                    "original_filename": "crushed_pet_bottle.jpg",
                    "image_url": "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop",
                    "category": "Plastic",
                    "object_label": "Water Bottle",
                    "description": "Crushed 1-litre drinking water bottle.",
                    "location_context": "Marina Beach Promenade",
                    "status": "PENDING_VERIFICATION",
                    "ai_predicted_category": "Plastic",
                    "ai_predicted_label": "Plastic Bottle",
                    "ai_confidence": 0.96
                },
                {
                    "user_name": "S. Rajesh",
                    "user_email": "rajesh.swm@gmail.com",
                    "original_filename": "tangled_chargers_cables.jpg",
                    "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop",
                    "category": "Other Waste",
                    "object_label": "Wires & Charger",
                    "description": "Old phone charging adapters and coiled white lightning cords.",
                    "location_context": "Mylapore Luz Corner",
                    "status": "PENDING_VERIFICATION",
                    "ai_predicted_category": "E-Waste",
                    "ai_predicted_label": "Charger & USB Cable",
                    "ai_confidence": 0.91
                },
                # Already Approved
                {
                    "user_name": "Priya Subramanian",
                    "user_email": "priya.chennai@gmail.com",
                    "original_filename": "corrugated_box_flattened.jpg",
                    "image_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop",
                    "category": "Paper",
                    "object_label": "Cardboard Box",
                    "description": "Flattened amazon shipping carton bundle.",
                    "location_context": "Adyar LB Road",
                    "status": "Added to Dataset",
                    "ai_predicted_category": "Paper",
                    "ai_predicted_label": "Corrugated Box",
                    "ai_confidence": 0.95,
                    "verified_by_admin_name": "Dr. Ananya Natarajan",
                    "verified_category": "Paper",
                    "verified_label": "Corrugated Box"
                },
                # Rejected
                {
                    "user_name": "Arun Prakash",
                    "user_email": "arun.p@yahoo.com",
                    "original_filename": "blurry_dark_photo.jpg",
                    "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop",
                    "category": "Unknown",
                    "object_label": "Something metal",
                    "description": "Found on road, camera was moving.",
                    "location_context": "Royapuram MC Road",
                    "status": "Rejected",
                    "ai_predicted_category": "Other Waste",
                    "ai_predicted_label": "Unclear",
                    "ai_confidence": 0.35,
                    "verified_by_admin_name": "Dr. Ananya Natarajan",
                    "rejection_reason": "Blurry image with insufficient lighting and low contrast. Object contours cannot be verified."
                }
            ]

            for upl in sample_uploads:
                new_upl = Upload(
                    upload_id=f"UPL-20260908-{random.randint(100000, 999999)}",
                    user_id=citizen.id if citizen else None,
                    user_name=upl["user_name"],
                    user_email=upl["user_email"],
                    original_filename=upl["original_filename"],
                    stored_image_path=upl["image_url"],
                    image_url=upl["image_url"],
                    file_size_bytes=random.randint(250000, 1800000),
                    mime_type="image/jpeg",
                    category=upl["category"],
                    object_label=upl["object_label"],
                    description=upl.get("description"),
                    location_context=upl.get("location_context"),
                    status=upl["status"],
                    ai_predicted_category=upl.get("ai_predicted_category"),
                    ai_predicted_label=upl.get("ai_predicted_label"),
                    ai_confidence=upl.get("ai_confidence"),
                    verified_by_admin_name=upl.get("verified_by_admin_name"),
                    verified_category=upl.get("verified_category"),
                    verified_label=upl.get("verified_label"),
                    rejection_reason=upl.get("rejection_reason"),
                    created_at=datetime.utcnow() - timedelta(hours=random.randint(2, 48))
                )
                db.add(new_upl)
            db.commit()
            print("Sample user uploads seeded.")

        print("Migration and seeding finished successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
