# GCS — Guia do Customer Success

Ferramenta pessoal de trabalho para o CSM da Pagsmile IP. Monorepo com
frontend React (Vercel) + backend FastAPI (Render) + Supabase (banco/auth/storage).

> Status: **Fase 1 concluída** — setup, login e health check. Veja `GCS_Manual_Desenvolvimento.md` para o roteiro completo das 7 fases.

## Estrutura

```
GCS/
├── frontend/   ← React + Vite + Tailwind
├── backend/    ← Python + FastAPI
└── GCS_Manual_Desenvolvimento.md
```

## Stack

| Camada    | Tecnologia                  | Hospedagem |
|-----------|-----------------------------|------------|
| Frontend  | React + Vite + Tailwind CSS | Vercel     |
| Backend   | Python + FastAPI            | Render     |
| Banco/Auth| PostgreSQL + Supabase Auth  | Supabase   |

---

## Rodando localmente

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (PowerShell: .venv\Scripts\Activate.ps1)
pip install -r requirements.txt
copy .env.example .env         # preencha as chaves do Supabase
uvicorn app.main:app --reload --port 8000
```

Teste: http://localhost:8000/health → `{"status": "ok"}`
Docs interativas: http://localhost:8000/docs

### 2. Frontend (React)

```bash
cd frontend
npm install
copy .env.local.example .env.local   # preencha URL + anon key do Supabase
npm run dev
```

Abra http://localhost:5173

---

## Configuração das contas (Fase 1)

### Supabase
1. Crie um projeto chamado `gcs` em https://supabase.com
2. **Authentication → Providers → Email**: ative.
3. **Authentication → Sign In / Up → Email**: desabilite "Confirm email" (facilita testes).
4. **SQL Editor → New query**: cole e rode `backend/schema.sql`.
5. Pegue as chaves em **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL` (backend) e `VITE_SUPABASE_URL` (frontend)
   - `anon public` → `VITE_SUPABASE_ANON_KEY` (frontend)
   - `service_role` → `SUPABASE_SERVICE_KEY` (backend) ⚠️ secreta, nunca no frontend
   - **Project Settings → API → JWT Settings → JWT Secret** → `SUPABASE_JWT_SECRET` (backend)

### Vercel (frontend)
1. Importe o repositório do GitHub.
2. **Root Directory**: `frontend`.
3. Framework preset: Vite.
4. **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (URL do Render).
5. O `vercel.json` já trata o rewrite de rotas do React Router.

### Render (backend)
1. **New → Web Service** apontando para o repositório.
2. **Root Directory**: `backend`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. **Environment Variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS` (inclua o domínio da Vercel).

---

## Próximas fases

| Fase | Entrega                        |
|------|--------------------------------|
| 2    | Clientes + Jornada de onboarding |
| 3    | Home + Tarefas                 |
| 4    | Relatório + export PDF         |
| 5    | Guia da API                    |
| 6    | Caderno de campo               |
| 7    | Dark mode, polish e deploy     |

---

*GCS — Pagsmile IP · Desenvolvido por Léo Borges · 2026*
