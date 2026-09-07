import sqlite3
from passlib.hash import pbkdf2_sha256

conn = sqlite3.connect("backend/chennai_waste.db")
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
columns = [row[1] for row in cursor.fetchall()]
print("Existing user columns:", columns)

if "organization" not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN organization TEXT DEFAULT 'Resident Contributor'")
if "city" not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN city TEXT DEFAULT 'Chennai'")
if "profile_image" not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN profile_image TEXT")
if "updated_at" not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP")

cursor.execute("""
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

passwords = {
    "admin@chennaiswm.gov.in": pbkdf2_sha256.hash("Admin@123"),
    "kumar.swm@chennaiswm.gov.in": pbkdf2_sha256.hash("Officer@123"),
    "operator.perungudi@chennaiswm.gov.in": pbkdf2_sha256.hash("Operator@123"),
    "ai.lead@chennaiswm.gov.in": pbkdf2_sha256.hash("Admin@123"),
    "priya.chennai@gmail.com": pbkdf2_sha256.hash("Citizen@123"),
    "guest@chennai.in": pbkdf2_sha256.hash("Guest@123"),
}

for email, h in passwords.items():
    cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (h, email))

# Set organizations for default users
cursor.execute("UPDATE users SET organization = 'Greater Chennai Corporation (GCC)', city = 'Chennai' WHERE username = 'admin'")
cursor.execute("UPDATE users SET organization = 'GCC Zone 8 - Anna Nagar', city = 'Chennai' WHERE username = 'officer_kumar'")
cursor.execute("UPDATE users SET organization = 'Perungudi SWM Processing Plant', city = 'Chennai' WHERE username = 'plant_operator'")
cursor.execute("UPDATE users SET organization = 'IIT Madras / GCC AI Lab', city = 'Chennai' WHERE username = 'ai_admin'")
cursor.execute("UPDATE users SET organization = 'Chennai Green Earth Citizens Club', city = 'Chennai' WHERE username = 'citizen_priya'")
cursor.execute("UPDATE users SET organization = 'Chennai Resident', city = 'Chennai' WHERE username = 'public_guest'")

conn.commit()
print("Migration completed successfully! Users verified with secure PBKDF2-SHA256 hashes.")