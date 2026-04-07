-- Enable extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('doctor', 'student', 'patient', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'triage_level') then
    create type triage_level as enum ('EMERGENCY', 'URGENT', 'ROUTINE');
  end if;
end $$;

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role user_role not null default 'patient',
  specialty text,
  dci_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role user_role default 'patient',
  add column if not exists specialty text,
  add column if not exists dci_number text,
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 2. PATIENTS
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete restrict,
  full_name text not null,
  date_of_birth date,
  gender text,
  contact_number text,
  medical_history text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patients
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists doctor_id uuid references public.profiles(id) on delete restrict,
  add column if not exists full_name text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists contact_number text,
  add column if not exists medical_history text,
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 3. APPOINTMENTS
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  doctor_id uuid references public.profiles(id) on delete cascade not null,
  appointment_date timestamp with time zone not null,
  duration_minutes int not null default 30,
  type text not null,
  status appointment_status not null default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appointments
  add column if not exists patient_id uuid references public.patients(id) on delete cascade,
  add column if not exists doctor_id uuid references public.profiles(id) on delete cascade,
  add column if not exists appointment_date timestamp with time zone,
  add column if not exists duration_minutes int default 30,
  add column if not exists type text,
  add column if not exists status appointment_status default 'scheduled',
  add column if not exists notes text,
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 4. TRIAGE SESSIONS
create table if not exists public.triage_sessions (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  doctor_id uuid references public.profiles(id) on delete cascade not null,
  triage_level triage_level not null,
  confidence_score numeric(4,3) not null,
  reasoning text not null,
  red_flags text[] default '{}',
  ai_recommendation jsonb not null,
  needs_doctor_review boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.triage_sessions
  add column if not exists patient_id uuid references public.patients(id) on delete cascade,
  add column if not exists doctor_id uuid references public.profiles(id) on delete cascade,
  add column if not exists triage_level triage_level,
  add column if not exists confidence_score numeric(4,3),
  add column if not exists reasoning text,
  add column if not exists red_flags text[] default '{}',
  add column if not exists ai_recommendation jsonb default '{}'::jsonb,
  add column if not exists needs_doctor_review boolean default false,
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 5. KNOWLEDGE BASE
create table if not exists public.knowledge_base (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  metadata jsonb,
  embedding vector(768)
);

alter table public.knowledge_base
  add column if not exists content text,
  add column if not exists metadata jsonb,
  add column if not exists embedding vector(768);

-- 6. PLATFORM METRICS
create table if not exists public.platform_metrics (
  id uuid default gen_random_uuid() primary key,
  metric_name text not null,
  metric_value numeric not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.platform_metrics
  add column if not exists metric_name text,
  add column if not exists metric_value numeric,
  add column if not exists recorded_at timestamp with time zone default timezone('utc'::text, now());

-- RLS
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.triage_sessions enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.platform_metrics enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Doctors can view and edit own patients" on public.patients;
create policy "Doctors can view and edit own patients"
  on public.patients for all
  using (auth.uid() = doctor_id);

drop policy if exists "Patients can view own CRM record" on public.patients;
create policy "Patients can view own CRM record"
  on public.patients for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all patients" on public.patients;
create policy "Admins can view all patients"
  on public.patients for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Doctors manage own appointments" on public.appointments;
create policy "Doctors manage own appointments"
  on public.appointments for all
  using (auth.uid() = doctor_id);

drop policy if exists "Patients view own appointments" on public.appointments;
create policy "Patients view own appointments"
  on public.appointments for select
  using (exists (select 1 from public.patients where patients.id = appointments.patient_id and patients.user_id = auth.uid()));

drop policy if exists "Admins view all appointments" on public.appointments;
create policy "Admins view all appointments"
  on public.appointments for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Doctors manage own patient triages" on public.triage_sessions;
create policy "Doctors manage own patient triages"
  on public.triage_sessions for all
  using (auth.uid() = doctor_id);

drop policy if exists "Patients view own triages" on public.triage_sessions;
create policy "Patients view own triages"
  on public.triage_sessions for select
  using (exists (select 1 from public.patients where patients.id = triage_sessions.patient_id and patients.user_id = auth.uid()));

drop policy if exists "Anyone can read knowledge base" on public.knowledge_base;
create policy "Anyone can read knowledge base"
  on public.knowledge_base for select using (true);

drop policy if exists "Only admins edit knowledge base" on public.knowledge_base;
create policy "Only admins edit knowledge base"
  on public.knowledge_base for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Only admins view metrics" on public.platform_metrics;
create policy "Only admins view metrics"
  on public.platform_metrics for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Profile sync
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'patient')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
