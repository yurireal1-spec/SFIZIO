from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models, schemas
from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.user.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = schemas.user.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não foi possível validar as credenciais",
        )
    user = db.query(models.user.User).filter(models.user.User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

def get_current_active_user(
    current_user: models.user.User = Depends(get_current_user),
) -> models.user.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user

def get_current_active_superuser(
    current_user: models.user.User = Depends(get_current_user),
) -> models.user.User:
    if not current_user.is_superuser and current_user.role != models.user.UserRole.ADMIN:
        raise HTTPException(
            status_code=400, detail="O usuário não tem privilégios suficientes"
        )
    return current_user
