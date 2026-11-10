# Merchy — AI Inventory & Demand Forecasting

A runnable full-stack starter with Next.js frontend, FastAPI backend, PostgreSQL, and a baseline forecasting endpoint.

## Requirements
- Node.js 20+
- Python 3.11+
- Docker Desktop (recommended)

## Run with Docker
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Run locally
### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Set `DATABASE_URL` if using PostgreSQL. For a quick local demo, the backend defaults to SQLite.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Demo data
The backend creates demo products and inventory transactions on first startup when the database is empty.

## Notes
- Forecasting is a transparent baseline using recent daily sales averages. It is not a production-grade ML model.
- Shopify integration, OAuth, billing, multi-tenant isolation, and production authentication are not included in this starter.
- Change all secrets and review security before deployment.
