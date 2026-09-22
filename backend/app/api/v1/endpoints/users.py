from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api.deps import get_db, get_current_active_user
from app.core import security

router = APIRouter()

@router.post("/", response_model=schemas.user.User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.user.UserCreate
) -> Any:
    """
    Cria um novo usuário (Cliente ou Vendedor).
    """
    user = db.query(models.user.User).filter(models.user.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )
    
    db_obj = models.user.User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=models.user.UserRole.CUSTOMER,
        is_active=True,
        is_superuser=False,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/me", response_model=schemas.user.User)
def read_user_me(
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_active_user),
) -> Any:
    """
    Retorna o perfil do usuário logado. (Mocked logic for now)
    """
    return current_user
