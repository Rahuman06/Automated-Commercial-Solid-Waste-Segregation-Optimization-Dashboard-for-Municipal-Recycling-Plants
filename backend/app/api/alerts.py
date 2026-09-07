from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.optimization import OperationalAlert
from app.schemas.common_schemas import AlertSchema

router = APIRouter(prefix="/alerts", tags=["Alert System"])

@router.get("/", response_model=List[AlertSchema])
def get_alerts(priority: Optional[str] = None, status: Optional[str] = "Active", db: Session = Depends(get_db)):
    query = db.query(OperationalAlert)
    if priority:
        query = query.filter(OperationalAlert.priority == priority)
    if status:
        query = query.filter(OperationalAlert.status == status)
    return query.order_by(OperationalAlert.timestamp.desc()).all()

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(OperationalAlert).filter(OperationalAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "Resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": f"Alert {alert.alert_code} resolved"}
