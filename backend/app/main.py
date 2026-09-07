import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database

# Import routers
from app.api import (
    auth, dashboard, waste, wards, plants,
    vehicles, detections, contributions,
    training, models, datasets, optimization,
    alerts, environmental, simulation, memory
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed database with authentic Chennai data
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.1.0",
    description="Automated Solid Waste Segregation & AI Model Continuous Improvement Dashboard for Municipal Recycling Plants (Greater Chennai Corporation)"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media static uploads
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.MEDIA_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(waste.router, prefix=settings.API_V1_STR)
app.include_router(wards.router, prefix=settings.API_V1_STR)
app.include_router(plants.router, prefix=settings.API_V1_STR)
app.include_router(vehicles.router, prefix=settings.API_V1_STR)
app.include_router(detections.router, prefix=settings.API_V1_STR)
app.include_router(contributions.router, prefix=settings.API_V1_STR)
app.include_router(training.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)
app.include_router(optimization.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(environmental.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "city": "Chennai, Tamil Nadu",
        "zones_count": 15,
        "wards_count": 200,
        "version": "2.1.0"
    }

# Friendly global error handler for non-technical users
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "user_message": "Something went wrong while loading this municipal information. Please try again.",
            "dev_details": str(exc)
        }
    )
