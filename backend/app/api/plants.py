from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.facility import SegregationPlant
from app.schemas.common_schemas import PlantSchema

router = APIRouter(prefix="/plants", tags=["Segregation & Recycling Plants"])

@router.get("/", response_model=List[PlantSchema])
def get_plants(
    status: Optional[str] = Query(None, pattern="^(active|inactive|maintenance)"),
    facility_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SegregationPlant)
    if status:
        query = query.filter(SegregationPlant.status == status)
    if facility_type:
        query = query.filter(SegregationPlant.facility_type.ilike(f"%{facility_type}%"))

    plants = query.all()
    results = []
    for p in plants:
        util = round((p.current_input_tpd / p.capacity_tpd * 100), 1) if p.capacity_tpd > 0 else 0.0
        results.append(PlantSchema(
            id=p.id,
            name=p.name,
            facility_type=p.facility_type,
            latitude=p.latitude,
            longitude=p.longitude,
            capacity_tpd=p.capacity_tpd,
            current_input_tpd=p.current_input_tpd,
            utilization_pct=util,
            status=p.status,
            accepted_categories=p.accepted_categories,
            operator_name=p.operator_name,
            contact_phone=p.contact_phone,
            address=p.address
        ))
    return results

@router.put("/{plant_id}/status")
def update_plant_status(plant_id: int, status: str, current_input: Optional[float] = None, db: Session = Depends(get_db)):
    plant = db.query(SegregationPlant).filter(SegregationPlant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    plant.status = status
    if current_input is not None:
        plant.current_input_tpd = current_input
    db.commit()
    return {"success": True, "message": f"Plant {plant.name} updated to {status}"}
