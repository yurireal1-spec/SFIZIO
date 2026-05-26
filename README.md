<<<<<<< HEAD
# SFIZIO - E-commerce de Móveis Premium

Bem-vindo ao **SFIZIO**, uma plataforma de e-commerce moderna e escalável desenvolvida com **FastAPI** e **Next.js**, focada no mercado de mobiliário de luxo.

## 🚀 Como Iniciar o Projeto

Siga os passos abaixo para rodar o sistema localmente:

### 1. Banco de Dados (Docker)
Certifique-se de ter o Docker instalado e rode:
```bash
docker-compose up -d
```
Isso iniciará o **PostgreSQL** e o **Adminer** (disponível em localhost:8080).

### 2. Backend (FastAPI)
Abra o terminal na pasta `/backend`:
```bash
# 1. Crie um ambiente virtual
python -m venv venv
source venv/bin/scripts/activate  # Windows: venv\Scripts\activate

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Popule o banco com dados iniciais (Seed)
python seed_data.py

# 4. Inicie o servidor
uvicorn app.main:app --reload
```
A API estará disponível em `http://localhost:8000/docs`.

### 3. Frontend (Next.js)
Abra o terminal na pasta `/frontend`:
```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev
```
Acesse `http://localhost:3000` para ver a interface premium.

---

## 🛠 Tecnologias Utilizadas
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, JWT (Passlib/Bcrypt).
- **Frontend**: Next.js 14 (App Router), TypeScript, Zustand (Estado do Carrinho), Framer Motion (Animações).
- **Design**: Vanilla CSS Modules (Foco em performance e SEO).

## 🎨 Funcionalidades Entregues
- [x] Vitrine Editorial com design minimalista.
- [x] Carrinho lateral dinâmico (Cart Drawer) com persistência local.
- [x] Sistema de Autenticação para Clientes e Vendedores.
- [x] Fluxo de Checkout e registro de Pedidos.
- [x] Script de Seed com dados de marcas inspiradoras (Artefacto/Dunelli).
=======
# SFIZIO
>>>>>>> 0c5489e045ae38df849359a272292eefe3319b26
