import sys
import os

# Adiciona o diretório atual ao sys.path para permitir importações do módulo 'app'
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app import models
from app.core import security
from app.models.user import UserRole

def create_admin():
    db = SessionLocal()
    
    email = os.environ.get("SFIZIO_ADMIN_EMAIL")
    password = os.environ.get("SFIZIO_ADMIN_PASSWORD")
    if not email or not password:
        raise RuntimeError("Defina SFIZIO_ADMIN_EMAIL e SFIZIO_ADMIN_PASSWORD antes de executar")
    
    # Verifica se o usuário já existe
    user = db.query(models.user.User).filter(models.user.User.email == email).first()
    if user:
        print(f"Usuário {email} já existe. Atualizando para Admin...")
        user.hashed_password = security.get_password_hash(password)
        user.role = UserRole.ADMIN
        user.is_superuser = True
        user.is_active = True
    else:
        print(f"Criando novo usuário Admin: {email}")
        user = models.user.User(
            email=email,
            hashed_password=security.get_password_hash(password),
            full_name="Yuri Marcatto",
            role=UserRole.ADMIN,
            is_superuser=True,
            is_active=True
        )
        db.add(user)
    
    db.commit()
    print(f"Admin {email} configurado com sucesso!")
    db.close()

if __name__ == "__main__":
    create_admin()
