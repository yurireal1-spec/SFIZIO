import json
from typing import Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps

router = APIRouter()

_CACHE = {}
_CACHE_TTL = timedelta(minutes=5)
DEFAULT_HERO_CONTENT = {
    "title": "A Essência do Design Atemporal",
    "subtitle": "Nova Coleção 2026",
    "description": "Móveis assinados que elevam o habitar à categoria de arte. Conheça o novo minimalismo sofisticado da SFIZIO.",
    "button_text": "Explorar Coleção",
    "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6",
}

@router.get("/", response_model=List[schemas.cms.SiteSettings])
def read_site_settings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retorna todas as configurações do site.
    """
    settings = db.query(models.cms.SiteSettings).offset(skip).limit(limit).all()
    return settings

@router.get("/{key}", response_model=schemas.cms.SiteSettings)
def read_setting_by_key(
    key: str,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Retorna uma configuração específica pela chave, utilizando cache.
    """
    now = datetime.now()
    if key in _CACHE and (now - _CACHE[key]["time"]) < _CACHE_TTL:
        return _CACHE[key]["data"]

    setting = db.query(models.cms.SiteSettings).filter(models.cms.SiteSettings.key == key).first()
    if not setting:
        if key == "hero_content":
            return {
                "id": 0,
                "key": key,
                "value": json.dumps(DEFAULT_HERO_CONTENT),
                "description": "Conteúdo padrão da seção Hero",
                "updated_at": now,
            }
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    _CACHE[key] = {"data": setting, "time": now}
    return setting

@router.post("/", response_model=schemas.cms.SiteSettings)
def create_setting(
    *,
    db: Session = Depends(deps.get_db),
    setting_in: schemas.cms.SiteSettingsCreate,
    current_user: models.user.User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Cria uma nova configuração. Apenas para administradores.
    """
    setting = db.query(models.cms.SiteSettings).filter(models.cms.SiteSettings.key == setting_in.key).first()
    if setting:
        raise HTTPException(status_code=400, detail="Já existe uma configuração com esta chave.")
    
    db_obj = models.cms.SiteSettings(
        key=setting_in.key,
        value=setting_in.value,
        description=setting_in.description
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    if setting_in.key in _CACHE:
        del _CACHE[setting_in.key]
        
    return db_obj

@router.patch("/{key}", response_model=schemas.cms.SiteSettings)
def update_setting(
    *,
    db: Session = Depends(deps.get_db),
    key: str,
    setting_in: schemas.cms.SiteSettingsUpdate,
    current_user: models.user.User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Atualiza uma configuração existente. Apenas para administradores.
    """
    setting = db.query(models.cms.SiteSettings).filter(models.cms.SiteSettings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    update_data = setting_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(setting, field, update_data[field])
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    
    if key in _CACHE:
        del _CACHE[key]
        
    return setting
