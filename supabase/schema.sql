create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  summary text,
  total_estimated_cost numeric not null default 0,
  currency text not null default 'INR',
  itinerary jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

-- MVP note: inserts are performed by the FastAPI server using a server-side key.
-- Do not put a Supabase service-role key in frontend code. Add proper auth and
-- restrictive policies before exposing this app to real users.
