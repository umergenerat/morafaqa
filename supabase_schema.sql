-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: students
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  "fullName" text,
  "academicId" text, -- CNE
  "nationalId" text, -- for older students
  gender text, -- male/female
  grade text,
  "birthDate" text,
  "birthPlace" text,
  "scholarshipType" text, -- full/half
  "scholarshipNumber" text,
  "fatherName" text,
  "fatherPhone" text,
  "motherName" text,
  "motherPhone" text,
  "guardianName" text,
  "guardianPhone" text,
  "guardianAddress" text, -- Changed from 'address' to match app types
  "roomNumber" text,
  "photoUrl" text,
  "guardianId" text, -- Parent CNIE/National ID for linking (stored as text, not UUID)
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: users (App Users: Admin, Supervisor, Parent, Nurse, etc)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null, -- admin, supervisor, nurse, parent, bursar
  avatar text,
  phone text,
  email text,
  password text, -- simple password for this app level
  "nationalId" text, -- CIN
  "linkedStudentIds" text[], -- Array of student IDs for parents
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: behavior_records
create table if not exists public."behaviorRecords" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" uuid references public.students(id) on delete cascade,
  date text,
  type text, -- drawing, positive, negative
  description text,
  points integer, -- for gamification
  severity text, -- low, medium, high
  "reporterName" text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: health_records
create table if not exists public."healthRecords" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" uuid references public.students(id) on delete cascade,
  date text,
  condition text,
  treatment text,
  notes text,
  "isChronic" boolean,
  "hospitalVisit" boolean,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: attendance_records
create table if not exists public."attendanceRecords" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" uuid references public.students(id) on delete cascade,
  date text,
  status text, -- present, absent, late, excused
  type text, -- study, sleep, meal
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: activity_records
create table if not exists public."activityRecords" (
  id uuid primary key default uuid_generate_v4(),
  title text,
  date text,
  type text, -- sport, culture, religious, entertainment
  description text,
  location text,
  "supervisorId" uuid, -- ID of supervisor
  "participantIds" text[],
  photos text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: exit_records
create table if not exists public."exitRecords" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" uuid references public.students(id) on delete cascade,
  "exitDate" text,
  "returnDate" text,
  reason text,
  "isAuthorized" boolean,
  "authorizedBy" text,
  status text, -- active, returned, late
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: academic_records
create table if not exists public."academicRecords" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" uuid references public.students(id) on delete cascade,
  subject text,
  grade numrange, -- or just text/number
  term text, -- Term 1, Term 2
  year text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: maintenance_requests
create table if not exists public."maintenanceRequests" (
  id uuid primary key default uuid_generate_v4(),
  title text,
  description text,
  priority text, -- low, medium, high
  status text, -- pending, in_progress, completed
  location text,
  date text,
  "reporterId" uuid,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: settings
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique,
  value jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'students') then
    alter publication supabase_realtime add table public.students;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'users') then
    alter publication supabase_realtime add table public.users;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'behaviorRecords') then
    alter publication supabase_realtime add table public."behaviorRecords";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'healthRecords') then
    alter publication supabase_realtime add table public."healthRecords";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attendanceRecords') then
    alter publication supabase_realtime add table public."attendanceRecords";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activityRecords') then
    alter publication supabase_realtime add table public."activityRecords";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'exitRecords') then
    alter publication supabase_realtime add table public."exitRecords";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'academicRecords') then
    alter publication supabase_realtime add table public."academicRecords";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'maintenanceRequests') then
    alter publication supabase_realtime add table public."maintenanceRequests";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end;
$$;

-- Simple Policies (Public Access for now to match current app behavior)
-- WARNING: In production, you should lock this down!
alter table public.students enable row level security;
drop policy if exists "Public Access" on public.students;
create policy "Public Access" on public.students for all using (true);

alter table public.users enable row level security;
drop policy if exists "Public Access" on public.users;
create policy "Public Access" on public.users for all using (true);

alter table public."behaviorRecords" enable row level security;
drop policy if exists "Public Access" on public."behaviorRecords";
create policy "Public Access" on public."behaviorRecords" for all using (true);

alter table public."healthRecords" enable row level security;
drop policy if exists "Public Access" on public."healthRecords";
create policy "Public Access" on public."healthRecords" for all using (true);

alter table public."attendanceRecords" enable row level security;
drop policy if exists "Public Access" on public."attendanceRecords";
create policy "Public Access" on public."attendanceRecords" for all using (true);

alter table public."activityRecords" enable row level security;
drop policy if exists "Public Access" on public."activityRecords";
create policy "Public Access" on public."activityRecords" for all using (true);

alter table public."exitRecords" enable row level security;
drop policy if exists "Public Access" on public."exitRecords";
create policy "Public Access" on public."exitRecords" for all using (true);

alter table public."academicRecords" enable row level security;
drop policy if exists "Public Access" on public."academicRecords";
create policy "Public Access" on public."academicRecords" for all using (true);

alter table public."maintenanceRequests" enable row level security;
drop policy if exists "Public Access" on public."maintenanceRequests";
create policy "Public Access" on public."maintenanceRequests" for all using (true);

alter table public.settings enable row level security;
drop policy if exists "Public Access" on public.settings;
create policy "Public Access" on public.settings for all using (true);

-- Table: meal_orders
create table if not exists public.meal_orders (
  id uuid primary key default uuid_generate_v4(),
  date text not null,
  "baseCount" integer not null,
  "extraMeals" jsonb not null,
  notes text,
  "senderName" text not null,
  "isRamadan" boolean not null,
  status text default 'sent',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.meal_orders enable row level security;
drop policy if exists "Public Access" on public.meal_orders;
create policy "Public Access" on public.meal_orders for all using (true);
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'meal_orders') then
    alter publication supabase_realtime add table public.meal_orders;
  end if;
end;
$$;
