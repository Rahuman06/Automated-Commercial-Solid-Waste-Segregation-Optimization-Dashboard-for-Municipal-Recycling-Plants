from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api import dashboard

router = APIRouter(prefix="/simulation", tags=["Simulation Mode"])

@router.get("/status")
def get_simulation_status():
    return {
        "simulation_mode": dashboard.SIMULATION_MODE,
        "active_label": "SIMULATED DATA" if dashboard.SIMULATION_MODE else "HISTORICAL DATA / NEAR REAL-TIME",
        "description": "Simulation Mode generates demonstration GPS telemetry for 24 trucks and AI camera classification feeds."
    }

@router.post("/toggle")
def toggle_simulation(enabled: bool = None):
    if enabled is None:
        dashboard.SIMULATION_MODE = not dashboard.SIMULATION_MODE
    else:
        dashboard.SIMULATION_MODE = enabled
    return {
        "success": True,
        "simulation_mode": dashboard.SIMULATION_MODE,
        "badge_label": "SIMULATED DATA" if dashboard.SIMULATION_MODE else "HISTORICAL DATA",
        "message": f"Simulation Mode is now {'ENABLED' if dashboard.SIMULATION_MODE else 'DISABLED'}"
    }
