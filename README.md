# Connected

React + FastAPI + PostgreSQL starter.

## Stack
- **Frontend:** React (Vite + Vitest)
- **Backend:** FastAPI (uv + pytest)
- **Database:** PostgreSQL
- **CI/CD:** GitHub Actions

## Quick start

### Prerequisites
- Node 20+
- Python 3.12+
- uv (`pip install uv`)
- Docker + Docker Compose

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### Database (local dev)
```bash
docker compose up -d
```
