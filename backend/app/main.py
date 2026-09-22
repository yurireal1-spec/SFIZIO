from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title="SFIZIO API",
    description="Backend para e-commerce de móveis de alto padrão",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

from app.db.session import engine, SessionLocal
from app.models.base import Base
from app import models
from app.core import security
from app.models.user import UserRole
import os

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Se a tabela de categorias estiver vazia, roda o seed inicial de produtos
        if db.query(models.Category).count() == 0:
            print("Populando banco de dados com produtos iniciais (Seed)...")
            from seed_data import seed_db
            seed_db()
        
        # 2. Se não existir nenhum usuário administrador, cria o admin padrão
        if db.query(models.user.User).filter(models.user.User.is_superuser == True).count() == 0:
            admin_email = os.environ.get("SFIZIO_ADMIN_EMAIL", "admin@sfizio.com")
            admin_password = os.environ.get("SFIZIO_ADMIN_PASSWORD", "admin123")
            print(f"Criando usuário administrador inicial ({admin_email})...")
            admin_user = models.user.User(
                email=admin_email,
                hashed_password=security.get_password_hash(admin_password),
                full_name="Administrador",
                role=UserRole.ADMIN,
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
    except Exception as e:
        print(f"Aviso durante startup/seed: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Welcome to SFIZIO API", "docs": "/docs"}
