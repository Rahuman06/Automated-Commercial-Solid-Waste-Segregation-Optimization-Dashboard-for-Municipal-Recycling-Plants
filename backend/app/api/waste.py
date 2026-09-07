from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.waste import WasteCategory
from app.schemas.common_schemas import WasteCategorySchema

router = APIRouter(prefix="/waste", tags=["Waste Categories & Analysis"])

@router.get("/categories", response_model=List[WasteCategorySchema])
def get_waste_categories(db: Session = Depends(get_db)):
    return db.query(WasteCategory).all()

@router.get("/composition-trends")
def get_composition_trends():
    months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    return {
        "months": months,
        "series": [
            {"name": "Organic Waste", "color": "#10B981", "data": [2010, 2045, 2090, 2120, 2150, 2060]},
            {"name": "Food Waste", "color": "#84CC16", "data": [1150, 1180, 1210, 1240, 1220, 1192]},
            {"name": "Plastic", "color": "#0EA5E9", "data": [820, 795, 780, 770, 765, 758]},
            {"name": "Paper & Cardboard", "color": "#F59E0B", "data": [630, 645, 660, 675, 680, 650]},
            {"name": "Glass & Metal", "color": "#06B6D4", "data": [280, 290, 285, 295, 300, 271]},
            {"name": "Mixed Waste", "color": "#64748B", "data": [450, 390, 340, 300, 260, 216]}
        ],
        "key_insights": [
            "Organic and Food waste form 60.0% of Chennai's municipal waste stream.",
            "Plastic waste has dropped by 7.5% over the last 6 months following GCC single-use plastic enforcement.",
            "Mixed/unsegregated waste decreased by 52.0% due to source-segregation drives in Zones 8, 9, and 13.",
            "Paper and cardboard have the highest immediate recycling yield with 91.0% commercial recovery rate."
        ]
    }
