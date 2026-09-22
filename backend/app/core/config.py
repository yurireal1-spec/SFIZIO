from pathlib import Path
from typing import List, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SFIZIO"
    ENVIRONMENT: str = "development"

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://sfizio-ten.vercel.app",
    ]

    # SQLite is convenient locally; production should set DATABASE_URL to PostgreSQL.
    DATABASE_URL: str = "sqlite:///./sfizio.db"

    # Security
    SECRET_KEY: str = "dev-only-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    MERCADOPAGO_ACCESS_TOKEN: str = ""
    MERCADOPAGO_PUBLIC_KEY: str = ""
    MERCADOPAGO_WEBHOOK_SECRET: str = ""
    MERCADOPAGO_NOTIFICATION_URL: str = "http://localhost:8000/api/v1/orders/webhooks/mercadopago"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            if value.startswith("["):
                import json
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else [parsed]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        return [str(value)]

    @model_validator(mode="after")
    def validate_security(self):
        if self.ENVIRONMENT != "development" and len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY deve ter pelo menos 32 caracteres fora de development")
        if self.ENVIRONMENT == "production" and not self.MERCADOPAGO_ACCESS_TOKEN:
            raise ValueError("MERCADOPAGO_ACCESS_TOKEN deve estar configurado em produção")
        return self

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
