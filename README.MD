# FinSmart

FinSmart is a full-stack personal finance and investing learning platform.
It combines AI-powered guidance, investment calculators, a market simulator, and live market insights in a modern React interface with a FastAPI backend.

## Features

- AI financial assistant chat (`/api/chat`, `/api/ask-ai`)
- Affordability DNA analysis (`/api/affordability`)
- Investment calculator strategies:
  - SIP (Monthly)
  - Step-Up SIP
  - Lumpsum
  - Fixed Deposit
  - Recurring Deposit
  - PPF (Yearly)
- Learning Park guided module walkthroughs
- Live market data and simulator routes

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Motion

### Backend

- FastAPI
- Pydantic
- Google Generative AI (Gemini)
- yfinance
- httpx

## Project Structure

```text
FinSmart/
├─ api/                  # FastAPI backend
│  ├─ main.py
│  ├─ simulator_router.py
│  └─ ...
├─ app/                  # Main React frontend (Vite)
│  ├─ src/
│  ├─ package.json
│  └─ ...
├─ .gitignore
└─ README.MD
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

## Environment Variables

Create `api/.env` with:

```env
GEMINI_API_KEY=your_gemini_api_key
FINNHUB_API_KEY=your_finnhub_api_key
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=replace_with_a_long_random_secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
```

Create `app/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Setup and Run

## 1. Backend (FastAPI)

From `api/`:

```bash
python -m venv venv
# Windows PowerShell
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at `http://127.0.0.1:8000`.

## 2. Frontend (React + Vite)

From `app/`:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (default Vite port).

## Available Frontend Scripts

From `app/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API Endpoints (Core)

- `POST /api/chat` - conversational AI response
- `POST /api/ask-ai` - concept explanation (definition, analogy, example)
- `POST /api/affordability` - affordability recommendation
- `POST /api/calculate` - calculator engine
- `GET /api/quick-topics` - predefined learning prompts

## Notes

- Do not commit secrets or `.env` files.
- Generated outputs and caches are excluded by `.gitignore`.
- If calculations look stale, restart frontend dev server after code changes.

## Deployment

### Backend on Render

This repo includes `render.yaml` at project root. Render will use:

- `rootDir`: `api`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Required Render environment variables:

- `GEMINI_API_KEY`
- `FINNHUB_API_KEY`
- `DATABASE_URL`
- `JWT_SECRET`

Optional Render environment variables:

- `JWT_ALGORITHM` (default `HS256`)
- `JWT_EXPIRE_MINUTES` (default `10080`)

### Frontend on Vercel

Deploy from the `app/` folder (set Vercel project Root Directory to `app`).
This repo includes `app/vercel.json` for Vite build and SPA routing fallback.

Required Vercel environment variables:

- `VITE_API_BASE_URL` = your Render backend URL, for example `https://finsmart-api.onrender.com`