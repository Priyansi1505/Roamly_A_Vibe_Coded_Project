# Personalized Travel Itinerary Planner

A beginner-friendly MVP for the SkillWallet project: React + FastAPI, with optional Supabase persistence and optional Gemini API itinerary generation. It works locally even before you add API keys (a demo itinerary fallback is included).

## Features
- Collect destination, dates, budget, travel style, group size, interests, and pace.
- Generate a day-by-day itinerary with activity, meal, transport, and estimated costs.
- Edit the generated itinerary in the browser and download it as JSON.
- FastAPI backend with health endpoint and validation.
- Optional Supabase database persistence (SQL included).
- Optional Google Gemini API integration; without a key, the backend returns a useful demo itinerary.

## Requirements
- Python 3.10+
- Node.js 18+
- Internet connection for installing packages
- Supabase and Gemini keys are optional for local demo mode

## 1. Run the backend
```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## 2. Run the frontend (new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the URL Vite prints, usually http://localhost:5173.

## 3. Optional Gemini AI
Add `GEMINI_API_KEY` to `backend/.env`. The app will attempt Gemini generation; if the API call fails, it safely falls back to demo generation. Keep secrets in `.env`; never commit them to GitHub.

## 4. Optional Supabase
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Put `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env` (use a server-side key only in your local backend environment).
4. The backend stores trips when Supabase variables are configured. The MVP does not require Supabase to run.

## Project structure
```text
backend/
  main.py
  requirements.txt
  .env.example
frontend/
  index.html
  package.json
  .env.example
  src/
    main.jsx
    App.jsx
    styles.css
supabase/
  schema.sql
```

## What to say in your project review
"The frontend collects travel preferences and sends them to a FastAPI REST endpoint. The backend validates the request, generates a structured itinerary using Gemini when configured, and falls back to a demo generator otherwise. Supabase is an optional persistence layer for saving generated trips. The UI displays the itinerary and supports editing and JSON export."

## Important
This is a working MVP/starter, not a production travel booking engine. Prices and times in demo mode are illustrative estimates, not live quotes. Route optimization, live maps, real hotel availability, authentication, and collaboration can be added as future enhancements.
