from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserSignupRequest, UserLoginRequest
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)


auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post("/signup")
def signup(request: UserSignupRequest, db: Session = Depends(get_db)):
    email = request.email.lower().strip()

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered."
        )

    user = User(
        name=request.name.strip(),
        email=email,
        password_hash=hash_password(request.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Signup successful.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@auth_router.post("/login")
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    email = request.email.lower().strip()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    password_is_valid = verify_password(
        plain_password=request.password,
        password_hash=user.password_hash
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@auth_router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email
        }
    }