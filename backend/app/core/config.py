import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Chennai Solid Waste Segregation & AI Optimization Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "chennai-smart-waste-municipal-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_URL: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'chennai_waste.db').replace('\\', '/')}"
    MEDIA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    TRAINING_THRESHOLD: int = 500
    SIMULATION_MODE_DEFAULT: bool = False

settings = Settings()
