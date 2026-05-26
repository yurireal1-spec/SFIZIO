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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

from app.db.session import engine
from app.models.base import Base
from sqlalchemy import text

@app.on_event("startup")
def on_startup():
    # Cria qualquer tabela que esteja faltando no banco de dados SQLite
    Base.metadata.create_all(bind=engine)
    
    # Migração segura para adicionar coluna image_url
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE productoptionvalue ADD COLUMN image_url VARCHAR"))
            conn.commit()
    except Exception:
        pass # Coluna já existe

@app.get("/")
def root():
    return {"message": "Welcome to SFIZIO API", "docs": "/docs"}
