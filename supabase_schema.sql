-- Run this in Supabase SQL editor for MVP case persistence.

create extension if not exists pgcrypto;

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  age integer,
  sex text,
  chief_complaint text not null,
  medical_history text,
  clinical_findings text,
  severity text default 'ROUTINE',
  status text default 'active',
  doctor_action text default 'pending',
  pathway jsonb,
  created_at timestamptz not null default now()
);

alter table public.cases enable row level security;

-- Demo policy: allows anon read/write.
-- Tighten this with auth-based policies in production.
drop policy if exists "Allow anon read cases" on public.cases;
create policy "Allow anon read cases"
  on public.cases for select
  to anon
  using (true);

drop policy if exists "Allow anon insert cases" on public.cases;
create policy "Allow anon insert cases"
  on public.cases for insert
  to anon
  with check (true);

drop policy if exists "Allow anon update cases" on public.cases;
create policy "Allow anon update cases"
  on public.cases for update
  to anon
  using (true)
  with check (true);
