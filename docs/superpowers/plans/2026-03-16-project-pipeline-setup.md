# Connected — Project Pipeline Setup Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Connected project with a Vite React frontend, FastAPI backend, local PostgreSQL via Docker Compose, and GitHub Actions CI/CD — no application logic, just a working pipeline.

**Architecture:** Monorepo with `frontend/` (Vite + React + Vitest) and `backend/` (FastAPI + uv + pytest) as sibling directories. PostgreSQL runs locally via Docker Compose for development. GitHub Actions runs lint + test + build on every push/PR for both halves independently.

**Tech Stack:** Vite, React, Vitest, FastAPI, uv, PostgreSQL, Docker Compose, GitHub Actions, Ruff (Python linter)

---

## File Structure

```
Connected/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml       # lint + test + build for frontend
│       └── backend-ci.yml        # lint + test for backend
├── frontend/                     # Vite React app (scaffolded by Vite CLI)
│   ├── src/
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
├── backend/                      # FastAPI app managed by uv
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py               # FastAPI app + /health endpoint
│   ├── tests/
│   │   └── test_health.py
│   └── pyproject.toml            # uv project config
├── docker-compose.yml            # Local PostgreSQL for development
├── .env.example                  # Environment variable template
├── .gitignore
└── README.md
```

---

## Chunk 1: Repo Scaffold & Git Init

### Task 1: Initialize git and base files

**Files:**
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialize git repo**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
git init
```

Expected: `Initialized empty Git repository in .../Connected/.git/`

- [ ] **Step 2: Create .gitignore**

Create `.gitignore` with this content:

```gitignore
# Python
__pycache__/
*.py[cod]
.venv/
.env
*.egg-info/
dist/
.pytest_cache/
.ruff_cache/

# Node
node_modules/
dist/
.env.local
.env.*.local

# Editors
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Docker
*.log
```

- [ ] **Step 3: Create README.md**

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore README.md
git commit -m "chore: initialize repo with gitignore and README"
```

---

## Chunk 2: Frontend Scaffold

### Task 2: Scaffold Vite React app

**Files:**
- Create: `frontend/` (via Vite CLI)
- Modify: `frontend/vite.config.js` (add Vitest config)
- Create: `frontend/src/App.test.jsx`

- [ ] **Step 1: Scaffold Vite React app**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
npm create vite@latest frontend -- --template react
```

When prompted, accept defaults. This creates `frontend/` with a working React app.

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Install Vitest and testing deps**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Update vite.config.js to add Vitest config**

Open `frontend/vite.config.js`. Replace its contents with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
```

- [ ] **Step 5: Create setupTests.js**

Create `frontend/src/setupTests.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Write a smoke test**

Create `frontend/src/App.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders without crashing', () => {
  render(<App />)
  expect(document.body).toBeTruthy()
})
```

- [ ] **Step 7: Add test script to package.json**

In `frontend/package.json`, add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 8: Run the test to verify it passes**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected/frontend"
npm test
```

Expected: `1 passed`

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: `VITE v... ready` on `http://localhost:5173`. Press Ctrl+C to stop.

- [ ] **Step 10: Commit**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
git add frontend/
git commit -m "feat: scaffold Vite React frontend with Vitest"
```

---

## Chunk 3: Backend Scaffold

### Task 3: Scaffold FastAPI backend with uv

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: Initialize uv project**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
uv init backend
cd backend
```

Expected: `backend/` created with `pyproject.toml` and `hello.py`. Delete `hello.py`:

```bash
rm hello.py
```

- [ ] **Step 2: Add dependencies**

```bash
uv add fastapi uvicorn[standard]
uv add --dev pytest httpx ruff
```

Expected: `pyproject.toml` updated, `.venv/` created.

- [ ] **Step 3: Create app package**

```bash
mkdir -p app tests
touch app/__init__.py tests/__init__.py
```

- [ ] **Step 4: Write the failing test first**

Create `backend/tests/test_health.py`:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Run test to verify it fails**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected/backend"
uv run pytest tests/test_health.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.main'`

- [ ] **Step 6: Create app/main.py**

```python
from fastapi import FastAPI

app = FastAPI(title="Connected API")


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
uv run pytest tests/test_health.py -v
```

Expected: `1 passed`

- [ ] **Step 8: Verify dev server starts**

```bash
uv run uvicorn app.main:app --reload
```

Expected: `Uvicorn running on http://127.0.0.1:8000`. Visit `http://127.0.0.1:8000/health` → `{"status":"ok"}`. Press Ctrl+C to stop.

- [ ] **Step 9: Add ruff config to pyproject.toml**

Append to `backend/pyproject.toml`:

```toml
[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I"]
```

- [ ] **Step 10: Run linter**

```bash
uv run ruff check app/ tests/
```

Expected: no output (clean).

- [ ] **Step 11: Commit**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
git add backend/
git commit -m "feat: scaffold FastAPI backend with uv, health endpoint, pytest, ruff"
```

---

## Chunk 4: Docker Compose (Local PostgreSQL)

### Task 4: Local PostgreSQL via Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-connected}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-connected}
      POSTGRES_DB: ${POSTGRES_DB:-connected}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Create .env.example**

```env
POSTGRES_USER=connected
POSTGRES_PASSWORD=connected
POSTGRES_DB=connected
DATABASE_URL=postgresql://connected:connected@localhost:5432/connected
```

- [ ] **Step 3: Start PostgreSQL and verify**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
docker compose up -d
docker compose ps
```

Expected: `db` service shows `running`.

- [ ] **Step 4: Stop it again (we just verified it works)**

```bash
docker compose down
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add Docker Compose for local PostgreSQL dev"
```

---

## Chunk 5: GitHub Actions CI/CD

### Task 5: Frontend CI workflow

**Files:**
- Create: `.github/workflows/frontend-ci.yml`

- [ ] **Step 1: Create .github/workflows directory**

```bash
mkdir -p "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected/.github/workflows"
```

- [ ] **Step 2: Create frontend-ci.yml**

```yaml
name: Frontend CI

on:
  push:
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'

jobs:
  test:
    name: Lint, Test & Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

### Task 6: Backend CI workflow

**Files:**
- Create: `.github/workflows/backend-ci.yml`

- [ ] **Step 1: Create backend-ci.yml**

```yaml
name: Backend CI

on:
  push:
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'

jobs:
  test:
    name: Lint & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Lint with ruff
        run: uv run ruff check app/ tests/

      - name: Run tests
        run: uv run pytest tests/ -v
```

- [ ] **Step 2: Commit**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
git add .github/
git commit -m "ci: add GitHub Actions workflows for frontend and backend"
```

---

## Chunk 6: Push to GitHub

### Task 7: Create GitHub repo and push

- [ ] **Step 1: Create GitHub repository**

Go to https://github.com/new and create a repo named `Connected`.
- Keep it empty (no README, no .gitignore — we already have those).
- Copy the repo URL (e.g., `https://github.com/<your-username>/Connected.git`)

- [ ] **Step 2: Add remote and push**

```bash
cd "/c/Users/cliao/Desktop/Coding/Claude Projects/Connected"
git remote add origin https://github.com/<your-username>/Connected.git
git branch -M main
git push -u origin main
```

Expected: All commits pushed. Visit the repo on GitHub — you should see the `Actions` tab with workflows listed.

- [ ] **Step 3: Verify GitHub Actions triggered**

GitHub Actions runs on push. Go to the repo → **Actions** tab.
You should see `Frontend CI` and `Backend CI` runs. Both should pass.

---

## Done

The pipeline is fully set up:
- React (Vite) + Vitest for frontend
- FastAPI + uv + pytest + ruff for backend
- PostgreSQL via Docker Compose for local dev
- GitHub Actions CI on every push/PR (path-filtered per side)
- Everything committed and pushed

Next steps (application work): define data models, add database connection, build features.
