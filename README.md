# SFIZIO

E-commerce de móveis premium com frontend Next.js e API FastAPI.

## Execução local

### Banco de dados

Para usar PostgreSQL localmente:

```bash
docker-compose up -d
```

O Adminer fica disponível em `http://localhost:8080`. A aplicação usa SQLite por padrão para desenvolvimento; para PostgreSQL, configure `DATABASE_URL` conforme `backend/.env.example`.

### Backend

No diretório `backend`:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python seed_data.py
uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000` e a documentação em `http://localhost:8000/docs`.

Para criar o administrador local, defina `SFIZIO_ADMIN_EMAIL` e `SFIZIO_ADMIN_PASSWORD` no ambiente antes de executar `python create_admin.py`. Nunca use credenciais reais em arquivos versionados.

### Frontend

No diretório `frontend`:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Tecnologias

- Backend: FastAPI, SQLAlchemy, PostgreSQL ou SQLite, JWT e bcrypt.
- Frontend: Next.js 14, TypeScript, Zustand, Framer Motion e CSS Modules.
- Pagamentos: a confirmação automática atual existe apenas em `ENVIRONMENT=development`; produção deve usar tokenização e webhook autenticado do Mercado Pago.

## Operação

- O cadastro público sempre cria clientes. Promoção para administrador deve ser feita por operação interna.
- Preços, opções e estoque são recalculados e validados no backend.
- Antes de produção, configure `ENVIRONMENT`, `SECRET_KEY`, `DATABASE_URL` e `BACKEND_CORS_ORIGINS` por variáveis de ambiente.
