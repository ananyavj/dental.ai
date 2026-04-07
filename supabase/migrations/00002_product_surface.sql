alter table public.profiles
  add column if not exists institution text,
  add column if not exists avatar_url text,
  add column if not exists qualification text;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create table if not exists public.patient_cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  patient_name text not null,
  age integer,
  sex text,
  chief_complaint text not null,
  specialty text,
  severity triage_level not null default 'ROUTINE',
  status text not null default 'active',
  last_activity_at timestamp with time zone not null default timezone('utc'::text, now()),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.patient_cases(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  note_type text not null default 'progress',
  content text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.profiles(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  title text not null,
  mode text not null default 'Practitioner',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations(id) on delete cascade not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.patient_cases(id) on delete set null,
  doctor_id uuid references public.profiles(id) on delete set null,
  patient_name text not null,
  specialty text not null,
  subject text,
  letter text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.patient_cases(id) on delete set null,
  doctor_id uuid references public.profiles(id) on delete set null,
  patient_name text not null,
  urgency text,
  plan_json jsonb not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.patient_cases(id) on delete set null,
  doctor_id uuid references public.profiles(id) on delete set null,
  event_type text not null default 'ai_output',
  event_title text not null,
  action_status text not null default 'pending',
  severity triage_level default 'ROUTINE',
  event_payload jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.drug_catalog (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  brand_names text[] not null default '{}',
  drug_class text not null,
  dental_dose text,
  common_dental_use text,
  contraindications text[] not null default '{}',
  side_effects text[] not null default '{}',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.xray_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.patient_cases(id) on delete set null,
  doctor_id uuid references public.profiles(id) on delete set null,
  file_name text,
  imaging_type text,
  urgency text,
  report_json jsonb not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.peer_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.patient_cases(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  summary text not null,
  status text not null default 'pending',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.patient_cases enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.referrals enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.audit_events enable row level security;
alter table public.drug_catalog enable row level security;
alter table public.xray_reports enable row level security;
alter table public.peer_reviews enable row level security;

drop policy if exists "Doctors view patient cases" on public.patient_cases;
create policy "Doctors view patient cases"
  on public.patient_cases for select using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors manage patient cases" on public.patient_cases;
create policy "Doctors manage patient cases"
  on public.patient_cases for all using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors manage clinical notes" on public.clinical_notes;
create policy "Doctors manage clinical notes"
  on public.clinical_notes for all using (
    exists (
      select 1 from public.patient_cases
      where patient_cases.id = clinical_notes.case_id
      and (patient_cases.doctor_id = auth.uid() or patient_cases.doctor_id is null)
    )
  );

drop policy if exists "Doctors manage ai conversations" on public.ai_conversations;
create policy "Doctors manage ai conversations"
  on public.ai_conversations for all using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors manage ai messages" on public.ai_messages;
create policy "Doctors manage ai messages"
  on public.ai_messages for all using (
    exists (
      select 1 from public.ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and (ai_conversations.doctor_id = auth.uid() or ai_conversations.doctor_id is null)
    )
  );

drop policy if exists "Doctors manage referrals" on public.referrals;
create policy "Doctors manage referrals"
  on public.referrals for all using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors manage treatment plans" on public.treatment_plans;
create policy "Doctors manage treatment plans"
  on public.treatment_plans for all using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors view audit events" on public.audit_events;
create policy "Doctors view audit events"
  on public.audit_events for select using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors insert audit events" on public.audit_events;
create policy "Doctors insert audit events"
  on public.audit_events for insert with check (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Everyone reads drug catalog" on public.drug_catalog;
create policy "Everyone reads drug catalog"
  on public.drug_catalog for select using (true);

drop policy if exists "Admins manage drug catalog" on public.drug_catalog;
create policy "Admins manage drug catalog"
  on public.drug_catalog for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Doctors manage xray reports" on public.xray_reports;
create policy "Doctors manage xray reports"
  on public.xray_reports for all using (doctor_id = auth.uid() or doctor_id is null);

drop policy if exists "Doctors manage peer reviews" on public.peer_reviews;
create policy "Doctors manage peer reviews"
  on public.peer_reviews for all using (reviewer_id = auth.uid() or reviewer_id is null);

drop trigger if exists set_patient_cases_updated_at on public.patient_cases;
create trigger set_patient_cases_updated_at before update on public.patient_cases for each row execute procedure public.set_updated_at();
drop trigger if exists set_clinical_notes_updated_at on public.clinical_notes;
create trigger set_clinical_notes_updated_at before update on public.clinical_notes for each row execute procedure public.set_updated_at();
drop trigger if exists set_ai_conversations_updated_at on public.ai_conversations;
create trigger set_ai_conversations_updated_at before update on public.ai_conversations for each row execute procedure public.set_updated_at();
drop trigger if exists set_referrals_updated_at on public.referrals;
create trigger set_referrals_updated_at before update on public.referrals for each row execute procedure public.set_updated_at();
drop trigger if exists set_treatment_plans_updated_at on public.treatment_plans;
create trigger set_treatment_plans_updated_at before update on public.treatment_plans for each row execute procedure public.set_updated_at();
drop trigger if exists set_peer_reviews_updated_at on public.peer_reviews;
create trigger set_peer_reviews_updated_at before update on public.peer_reviews for each row execute procedure public.set_updated_at();

insert into public.patient_cases (id, patient_name, age, sex, chief_complaint, specialty, severity, status, last_activity_at)
values
  ('11111111-1111-1111-1111-111111111111', 'Rahul Mehta', 34, 'Male', 'Severe toothache upper left, pain radiating to ear', 'Endodontics', 'URGENT', 'active', timezone('utc'::text, now()) - interval '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'Sunita Patel', 52, 'Female', 'Loose teeth, bleeding gums, halitosis', 'Periodontics', 'ROUTINE', 'completed', timezone('utc'::text, now()) - interval '5 hours'),
  ('33333333-3333-3333-3333-333333333333', 'Arjun Nair', 19, 'Male', 'Swelling lower jaw, trismus, fever', 'Oral Surgery', 'URGENT', 'active', timezone('utc'::text, now()) - interval '1 hour'),
  ('44444444-4444-4444-4444-444444444444', 'Meera Joshi', 45, 'Female', 'White patch on inner cheek persisting for 3 months', 'Oral Medicine', 'URGENT', 'review', timezone('utc'::text, now()) - interval '1 day')
on conflict (id) do nothing;

insert into public.drug_catalog (id, generic_name, brand_names, drug_class, dental_dose, common_dental_use, contraindications, side_effects)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amoxicillin', '{"Novamox","Amoxil"}', 'Aminopenicillin antibiotic', '500 mg TDS for 5-7 days', 'Odontogenic infections and infective endocarditis prophylaxis', '{"Penicillin allergy","Infectious mononucleosis"}', '{"Nausea","Diarrhoea","Skin rash"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Metronidazole', '{"Metrogyl","Flagyl"}', 'Nitroimidazole antibiotic', '400 mg TDS for 5-7 days', 'Anaerobic dental infections and acute pericoronitis', '{"First trimester of pregnancy","Alcohol use"}', '{"Metallic taste","Nausea","Peripheral neuropathy"}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ibuprofen', '{"Brufen","Ibugesic"}', 'NSAID', '400 mg TDS after food', 'Acute dental pain and postoperative inflammation', '{"Peptic ulcer disease","NSAID allergy"}', '{"Gastric irritation","Fluid retention"}')
on conflict (id) do nothing;

insert into public.knowledge_base (id, content, metadata)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '2024 review comparing monolithic zirconia and lithium disilicate for posterior crowns.', '{"title":"Monolithic Zirconia vs Lithium Disilicate for Posterior Single Crowns","summary":"Monolithic zirconia showed stronger fracture resistance while lithium disilicate remained favorable for aesthetics.","type":"Material Review","journal":"Journal of Prosthetic Dentistry","date":"January 2024","tags":["Prosthodontics","Materials","Crowns"],"doi":"10.1016/j.prosdent.2023.10.019","content_type":"article"}'::jsonb),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024 AI-assisted bitewing validation study against expert radiologists.', '{"title":"AI-Assisted Caries Detection on Bitewing Radiographs","summary":"Model sensitivity reached 91.3% and specificity 88.7% in proximal caries detection.","type":"Research","journal":"Dentomaxillofacial Radiology","date":"March 2024","tags":["AI","Radiology","Caries"],"doi":"10.1259/dmfr.20230278","content_type":"article"}'::jsonb)
on conflict (id) do nothing;

insert into public.audit_events (id, case_id, event_type, event_title, action_status, severity, event_payload)
values
  ('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111', 'ai_output', 'Emergency pain pathway reviewed', 'accepted', 'URGENT', '{"source":"dashboard seed"}'::jsonb),
  ('34343434-3434-3434-3434-343434343434', '33333333-3333-3333-3333-333333333333', 'triage', 'Mandibular swelling escalated for doctor review', 'modified', 'URGENT', '{"source":"triage seed"}'::jsonb)
on conflict (id) do nothing;

insert into public.ai_conversations (id, title, mode)
values
  ('56565656-5656-5656-5656-565656565656', 'Ludwig''s angina management', 'Practitioner'),
  ('78787878-7878-7878-7878-787878787878', 'Vertucci classification explained', 'Student')
on conflict (id) do nothing;

insert into public.ai_messages (id, conversation_id, role, content)
values
  ('89898989-8989-8989-8989-898989898989', '56565656-5656-5656-5656-565656565656', 'assistant', 'Airway-first emergency plan drafted for same-day escalation.'),
  ('90909090-9090-9090-9090-909090909090', '78787878-7878-7878-7878-787878787878', 'assistant', 'Classification summary prepared with exam-oriented mnemonics.')
on conflict (id) do nothing;
