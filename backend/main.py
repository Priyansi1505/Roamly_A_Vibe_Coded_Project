import os
import json
import uuid
from datetime import date, timedelta
from typing import List, Optional
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="Personalized Travel Itinerary Planner API", version="1.0.0")
frontend_url = os.getenv("FRONTEND_URL", "").strip()

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date
    budget: float = Field(gt=0, le=10000000)
    currency: str = "INR"
    travel_style: str = "balanced"
    pace: str = "moderate"
    group_size: int = Field(default=1, ge=1, le=30)
    interests: List[str] = []
    notes: Optional[str] = ""

class Activity(BaseModel):
    time: str
    title: str
    category: str
    description: str
    estimated_cost: float
    transport: str

class DayPlan(BaseModel):
    day: int
    date: str
    theme: str
    activities: List[Activity]

class TripResponse(BaseModel):
    id: str
    destination: str
    summary: str
    total_estimated_cost: float
    currency: str
    days: List[DayPlan]
    source: str

def demo_itinerary(req: TripRequest):
    num_days = (req.end_date - req.start_date).days + 1
    interests = req.interests or ["sightseeing", "local food"]
    templates = [
        [
            ("09:00", "Local breakfast", "Food", "Start with a popular local breakfast spot.", 250, "Walk / auto"),
            ("10:30", "Explore a landmark", "Sightseeing", "Visit a well-known landmark; check opening times before leaving.", 300, "Auto / cab"),
            ("13:00", "Regional lunch", "Food", "Try a local speciality at a well-reviewed casual restaurant.", 400, "Walk"),
            ("15:00", "Museum or cultural stop", "Culture", "Spend a relaxed afternoon learning about local history.", 250, "Auto / cab"),
            ("17:30", "Sunset viewpoint", "Nature", "Leave some buffer time for photos and rest.", 150, "Auto / cab"),
            ("19:30", "Dinner", "Food", "Choose a nearby dinner option to avoid unnecessary travel.", 500, "Walk / auto"),
        ],
        [
            ("08:30", "Breakfast near your stay", "Food", "Keep the morning easy and plan the day's route.", 250, "Walk"),
            ("10:00", "Nature or adventure activity", "Nature", "Pick an activity that matches your fitness and comfort level.", 500, "Cab / local transit"),
            ("12:30", "Lunch break", "Food", "Take a proper break and hydrate.", 400, "Walk"),
            ("14:00", "Neighbourhood walk", "Explore", "Discover markets, crafts, and local streets at your own pace.", 200, "Walk"),
            ("17:00", "Cafe / downtime", "Leisure", "Keep this slot flexible for shopping or rest.", 300, "Walk"),
            ("19:00", "Dinner and evening stroll", "Food", "Finish with a relaxed meal close to your accommodation.", 500, "Walk / auto"),
        ],
        [
            ("09:00", "Breakfast", "Food", "Start the day with a simple local meal.", 250, "Walk"),
            ("10:00", "Signature attraction", "Sightseeing", "Prioritize one major attraction instead of rushing between many stops.", 500, "Auto / cab"),
            ("13:00", "Lunch", "Food", "Try a regional dish and allow time to rest.", 400, "Walk"),
            ("15:00", "Market or cultural district", "Culture", "Browse local shops and look for a low-cost experience.", 200, "Walk"),
            ("18:00", "Relaxed evening", "Leisure", "Use this time for a viewpoint, park, or an activity you missed.", 250, "Auto / cab"),
        ],
    ]
    days = []
    daily_budget = req.budget / max(num_days, 1)
    for i in range(num_days):
        source = templates[i % len(templates)]
        acts = []
        for time, title, category, desc, cost, transport in source:
            if req.travel_style.lower() in ("budget", "backpacker"):
                cost = round(cost * 0.65, 2)
            elif req.travel_style.lower() in ("luxury", "premium"):
                cost = round(cost * 1.8, 2)
            if category.lower() in [x.lower() for x in interests]:
                desc += " Prioritized because it matches your selected interests."
            acts.append({
                "time": time, "title": title, "category": category,
                "description": desc, "estimated_cost": cost * req.group_size,
                "transport": transport
            })
        # Scale illustrative activity estimates down if the requested budget is especially tight.
        raw_total = sum(a["estimated_cost"] for a in acts)
        if raw_total > daily_budget and daily_budget > 0:
            factor = max(0.45, daily_budget / raw_total)
            for a in acts:
                a["estimated_cost"] = round(a["estimated_cost"] * factor, 2)
        days.append({
            "day": i + 1,
            "date": (req.start_date + timedelta(days=i)).isoformat(),
            "theme": ["Discover the highlights", "Local experiences", "A relaxed final day"][i % 3],
            "activities": acts
        })
    total = round(sum(a["estimated_cost"] for d in days for a in d["activities"]), 2)
    return {
        "id": str(uuid.uuid4()),
        "destination": req.destination,
        "summary": f"A {num_days}-day {req.pace} itinerary for {req.group_size} traveller(s), shaped around {', '.join(interests)}.",
        "total_estimated_cost": total,
        "currency": req.currency,
        "days": days,
        "source": "demo"
    }

def gemini_itinerary(req: TripRequest):
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        return None
    prompt = f"""Create a practical travel itinerary and return ONLY valid JSON with keys:
summary (string), days (array of objects with day, date, theme, activities), total_estimated_cost (number).
Each activity must have time, title, category, description, estimated_cost (number), transport.
Destination: {req.destination}; dates: {req.start_date} to {req.end_date}; total budget: {req.budget} {req.currency};
travel style: {req.travel_style}; pace: {req.pace}; group size: {req.group_size};
interests: {', '.join(req.interests)}; extra notes: {req.notes}.
Keep the plan realistic, don't claim live availability, and label costs as estimates."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    try:
        response = requests.post(
            url + "?key=" + key,
            json={"contents": [{"parts": [{"text": prompt}]}],
                  "generationConfig": {"responseMimeType": "application/json", "temperature": 0.5}},
            timeout=35,
        )
        response.raise_for_status()
        raw = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(raw)
        data["id"] = str(uuid.uuid4())
        data["destination"] = req.destination
        data["currency"] = req.currency
        data["source"] = "gemini"
        return data
    except Exception:
        return None

def save_to_supabase(trip):
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_KEY", "").strip()
    if not url or not key:
        return
    try:
        from supabase import create_client
        client = create_client(url, key)
        client.table("trips").insert({
            "id": trip["id"],
            "destination": trip["destination"],
            "summary": trip["summary"],
            "total_estimated_cost": trip["total_estimated_cost"],
            "currency": trip["currency"],
            "itinerary": trip,
        }).execute()
    except Exception as exc:
        print("Supabase save skipped:", exc)

@app.get("/")
def root():
    return {"message": "Travel Planner API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/trips/generate", response_model=TripResponse)
def generate_trip(req: TripRequest):
    if req.end_date < req.start_date:
        raise HTTPException(status_code=400, detail="End date must be on or after start date.")
    if (req.end_date - req.start_date).days > 13:
        raise HTTPException(status_code=400, detail="MVP supports trips up to 14 days.")
    trip = gemini_itinerary(req) or demo_itinerary(req)
    save_to_supabase(trip)
    return trip
