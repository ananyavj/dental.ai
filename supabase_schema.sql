-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  specialty text,
  registration_number text,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- Peer cases
create table peer_cases (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  specialty text,
  clinical_data text,
  question text,
  tags text[],
  image_url text,
  status text default 'open',
  created_at timestamptz default now()
);

-- Comments / second opinions
create table peer_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references peer_cases(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

-- Endorsements (one per user per case)
create table endorsements (
  user_id uuid references profiles(id) on delete cascade,
  case_id uuid references peer_cases(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, case_id)
);

-- Enable RLS
alter table profiles enable row level security;
alter table peer_cases enable row level security;
alter table peer_comments enable row level security;
alter table endorsements enable row level security;

-- profiles
create policy "Auth users can read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "User can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Owner can update profile" on profiles for update using (auth.uid() = id);

-- peer_cases
create policy "Auth users can read cases" on peer_cases for select using (auth.role() = 'authenticated');
create policy "Author can insert cases" on peer_cases for insert with check (auth.uid() = author_id);
create policy "Author can update cases" on peer_cases for update using (auth.uid() = author_id);
create policy "Author can delete cases" on peer_cases for delete using (auth.uid() = author_id);

-- peer_comments
create policy "Auth users can read comments" on peer_comments for select using (auth.role() = 'authenticated');
create policy "Auth users can insert comments" on peer_comments for insert with check (auth.uid() = author_id);

-- endorsements
create policy "Auth users can read endorsements" on endorsements for select using (auth.role() = 'authenticated');
create policy "User can insert own endorsement" on endorsements for insert with check (auth.uid() = user_id);
create policy "User can delete own endorsement" on endorsements for delete using (auth.uid() = user_id);
