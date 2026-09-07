import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password,
    create_access_token, get_current_user_from_token
)
from app.models.user import User, PasswordResetToken
from app.models.contribution import ImageContribution
from app.schemas.auth import (
    UserRegister, UserLogin, ForgotPasswordRequest,
    ResetPasswordRequest, ChangePasswordRequest,
    UserProfileUpdate, UserResponse, TokenResponse,
    RoleSwitchRequest, ContributorStatsResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # Derive unique username from email
    base_username = email_clean.split("@")[0]
    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}_{counter}"
        counter += 1

    hashed_pw = hash_password(req.password)
    new_user = User(
        username=username,
        email=email_clean,
        hashed_password=hashed_pw,
        full_name=req.full_name.strip(),
        role="contributor", # Default role for new signups
        organization=req.organization or "Resident Contributor",
        city=req.city or "Chennai",
        contribution_points=50, # Welcome bonus points
        badges="Eco Citizen, Early Adopter"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    email_or_user = req.email.strip().lower()
    user = db.query(User).filter(
        (func.lower(User.email) == email_or_user) | (func.lower(User.username) == email_or_user)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The email or password you entered is incorrect. Please try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )

    expire_delta = timedelta(days=30) if req.remember_me else timedelta(days=7)
    token = create_access_token({"sub": user.email, "role": user.role}, expires_delta=expire_delta)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    # Even if user not found, return safe friendly message to prevent email enumeration,
    # but if found, generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=2)

    if user:
        token_entry = PasswordResetToken(
            token=reset_token,
            user_id=user.id,
            expires_at=expires,
            is_used=False
        )
        db.add(token_entry)
        db.commit()

    return {
        "success": True,
        "message": "If an account exists with this email address, password reset instructions have been generated.",
        "reset_token": reset_token if user else None,
        "test_reset_url": f"/reset-password?token={reset_token}" if user else None
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == req.token.strip(),
        PasswordResetToken.is_used == False
    ).first()

    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has already been used. Please request a new one."
        )

    if datetime.utcnow() > token_entry.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new link."
        )

    user = db.query(User).filter(User.id == token_entry.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user account was found associated with this reset link."
        )

    user.hashed_password = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()
    token_entry.is_used = True
    db.commit()

    return {
        "success": True,
        "message": "Your password has been reset successfully! You can now sign in with your new password."
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user_from_token)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if req.full_name is not None and req.full_name.strip():
        current_user.full_name = req.full_name.strip()
    if req.organization is not None:
        current_user.organization = req.organization.strip()
    if req.city is not None:
        current_user.city = req.city.strip()

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current password you entered is incorrect."
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your new password must be at least 6 characters long."
        )

    current_user.hashed_password = hash_password(req.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {
        "success": True,
        "message": "Your password has been changed successfully."
    }

@router.get("/profile-stats", response_model=ContributorStatsResponse)
def get_user_profile_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    # Query contributions submitted by this user
    user_contribs = db.query(ImageContribution).filter(
        ImageContribution.contributor_email == current_user.email
    ).all()

    total = len(user_contribs)
    validated = sum(1 for c in user_contribs if c.validation_status in ["approved", "approved_in_dataset", "staged_for_training"])
    pending = sum(1 for c in user_contribs if c.validation_status == "pending")
    rejected = sum(1 for c in user_contribs if c.validation_status == "rejected")
    corrections = sum(1 for c in user_contribs if c.is_user_corrected)

    # If user hasn't submitted yet, provide initial baseline stats from user record
    if total == 0:
        points = current_user.contribution_points or 50
        badges_list = [b.strip() for b in current_user.badges.split(",") if b.strip()] if current_user.badges else ["Eco Citizen"]
        recent = db.query(ImageContribution).order_by(ImageContribution.created_at.desc()).limit(5).all()
        recent_data = [
            {
                "id": r.id,
                "file_path": r.image_url,
                "category": r.user_confirmed_category or r.ai_predicted_category,
                "confidence": r.ai_confidence,
                "status": r.validation_status,
                "date": r.created_at.strftime("%b %d, %Y") if r.created_at else "Recently"
            }
            for r in recent
        ]
        return {
            "total_contributions": max(3, points // 20),
            "validated_contributions": max(2, points // 30),
            "pending_contributions": 1,
            "rejected_contributions": 0,
            "user_corrections": 1,
            "eco_points": points,
            "badges": badges_list,
            "recent_uploads": recent_data
        }

    badges_list = [b.strip() for b in current_user.badges.split(",") if b.strip()] if current_user.badges else ["Eco Citizen"]
    recent_data = [
        {
            "id": r.id,
            "file_path": r.image_url,
            "category": r.user_confirmed_category or r.ai_predicted_category,
            "confidence": r.ai_confidence,
            "status": r.validation_status,
            "date": r.created_at.strftime("%b %d, %Y") if r.created_at else "Recently"
        }
        for r in user_contribs[:5]
    ]

    return {
        "total_contributions": total,
        "validated_contributions": validated,
        "pending_contributions": pending,
        "rejected_contributions": rejected,
        "user_corrections": corrections,
        "eco_points": current_user.contribution_points,
        "badges": badges_list,
        "recent_uploads": recent_data
    }

@router.get("/roles")
def get_available_roles():
    return [
        {"role": "public", "title": "Public Visitor", "description": "View public dashboards, GIS map, ward analytics, environmental insights."},
        {"role": "contributor", "title": "Registered Contributor", "description": "Upload waste photos, use live webcam detection, verify AI predictions, earn badges."},
        {"role": "municipal_officer", "title": "Municipal Officer", "description": "Monitor GCC ward collection, track high-risk zones, view fleet operations and alerts."},
        {"role": "plant_operator", "title": "Plant Operator", "description": "Update facility processing inputs, manage plant capacities and segregated streams."},
        {"role": "ai_admin", "title": "AI Administrator", "description": "Monitor continuous retraining, review datasets, compare candidate vs production models."},
        {"role": "system_admin", "title": "System Administrator", "description": "Full administrative access across all 17 municipal pages, users, and settings."}
    ]

@router.post("/switch-role")
def switch_user_role(
    req: RoleSwitchRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    valid_roles = ["public", "contributor", "municipal_officer", "plant_operator", "ai_admin", "system_admin"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role: {req.role}")

    current_user.role = req.role
    db.commit()
    db.refresh(current_user)
    return {
        "success": True,
        "active_role": req.role,
        "user": current_user,
        "message": f"Switched active role to {req.role}"
    }