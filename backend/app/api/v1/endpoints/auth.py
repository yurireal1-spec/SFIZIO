from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import models, schemas
from app.api.deps import get_db
from app.core import security
from app.core.config import settings

router = APIRouter()
_LOGIN_ATTEMPTS = {}
_LOGIN_WINDOW = timedelta(minutes=1)
_MAX_LOGIN_ATTEMPTS = 5

@router.post("/login/access-token", response_model=schemas.user.Token)
def login_access_token(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Login via formulário OAuth2 (Username/Password)
    """
    now = datetime.utcnow()
    client_key = request.client.host if request.client else "unknown"
    attempts, started_at = _LOGIN_ATTEMPTS.get(client_key, (0, now))
    if now - started_at >= _LOGIN_WINDOW:
        attempts, started_at = 0, now
    if attempts >= _MAX_LOGIN_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um minuto.")

    user = db.query(models.user.User).filter(models.user.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        _LOGIN_ATTEMPTS[client_key] = (attempts + 1, started_at)
        raise HTTPException(status_code=400, detail="E-mail ou senha incorretos")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")

    _LOGIN_ATTEMPTS.pop(client_key, None)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    response.delete_cookie("access_token")
