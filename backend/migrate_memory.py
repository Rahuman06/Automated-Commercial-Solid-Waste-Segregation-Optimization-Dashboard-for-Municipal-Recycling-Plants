import sqlite3
import json
from datetime import datetime

conn = sqlite3.connect("backend/chennai_waste.db")
cursor = conn.cursor()

# Create user_ai_references table
cursor.execute("""
CREATE TABLE IF NOT EXISTS user_ai_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_id TEXT,
    image_url TEXT NOT NULL,
    image_hash TEXT NOT NULL,
    confirmed_item TEXT NOT NULL,
    confirmed_waste_category TEXT NOT NULL DEFAULT 'E-Waste',
    image_embedding_json TEXT NOT NULL,
    embedding_model_version TEXT DEFAULT 'v2.2-embed',
    reference_status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)
""")

# Create index on user_id and image_hash
cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_ai_ref_user ON user_ai_references(user_id)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_ai_ref_hash ON user_ai_references(image_hash)")

# Check if admin user has sample references, if not seed
cursor.execute("SELECT id FROM users WHERE username = 'admin'")
admin_row = cursor.fetchone()
if admin_row:
    admin_id = admin_row[0]
    cursor.execute("SELECT COUNT(*) FROM user_ai_references WHERE user_id = ?", (admin_id,))
    if cursor.fetchone()[0] == 0:
        # Generate synthetic 128-dim normalized embedding vector representative of a mobile phone
        # High aspect ratio, dark screen center, sharp border gradient
        import numpy as np
        np.random.seed(42)
        phone_vec = np.random.normal(0, 1, 128)
        # Emphasize screen aspect ratio (dim 96) and dark luminance (dim 0-16)
        phone_vec[96] = 2.4 # Aspect ratio ~ 2.0
        phone_vec[0:16] = -1.2 # Dark screen
        phone_vec = phone_vec / np.linalg.norm(phone_vec)

        charger_vec = np.random.normal(0, 1, 128)
        charger_vec[96] = 1.1 # Compact block aspect ratio
        charger_vec[16:32] = 1.8 # White/matte charger casing
        charger_vec = charger_vec / np.linalg.norm(charger_vec)

        cursor.execute("""
            INSERT INTO user_ai_references 
            (user_id, image_id, image_url, image_hash, confirmed_item, confirmed_waste_category, image_embedding_json, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            admin_id,
            "REF-PHONE-001",
            "/assets/samples/phone_ref_sample.jpg",
            "hash_phone_ref_001_demo",
            "Mobile Phone",
            "E-Waste",
            json.dumps(phone_vec.tolist()),
            "Personal reference smartphone (black glass back, dual camera module)"
        ))

        cursor.execute("""
            INSERT INTO user_ai_references 
            (user_id, image_id, image_url, image_hash, confirmed_item, confirmed_waste_category, image_embedding_json, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            admin_id,
            "REF-CHARGER-002",
            "/assets/samples/charger_ref_sample.jpg",
            "hash_charger_ref_002_demo",
            "Charger",
            "E-Waste",
            json.dumps(charger_vec.tolist()),
            "USB-C Fast Charging Adapter with detached cable"
        ))

conn.commit()
print("Migration completed successfully: user_ai_references table ready.")