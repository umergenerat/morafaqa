-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: students
create table public.students (
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
create table public.users (
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
create table public."behaviorRecords" (
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
create table public."healthRecords" (
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
create table public."attendanceRecords" (
  id uuid primary key default uuid_generate_v4(),
  "studentId" uuid references public.students(id) on delete cascade,
  date text,
  status text, -- present, absent, late, excused
  type text, -- study, sleep, meal
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: activity_records
create table public."activityRecords" (
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
create table public."exitRecords" (
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
create table public."academicRecords" (
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
create table public."maintenanceRequests" (
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
create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique,
  value jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Realtime
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public."behaviorRecords";
alter publication supabase_realtime add table public."healthRecords";
alter publication supabase_realtime add table public."attendanceRecords";
alter publication supabase_realtime add table public."activityRecords";
alter publication supabase_realtime add table public."exitRecords";
alter publication supabase_realtime add table public."academicRecords";
alter publication supabase_realtime add table public."maintenanceRequests";
alter publication supabase_realtime add table public.settings;

-- Simple Policies (Public Access for now to match current app behavior)
-- WARNING: In production, you should lock this down!
alter table public.students enable row level security;
create policy "Public Access" on public.students for all using (true);

alter table public.users enable row level security;
create policy "Public Access" on public.users for all using (true);

alter table public."behaviorRecords" enable row level security;
create policy "Public Access" on public."behaviorRecords" for all using (true);

alter table public."healthRecords" enable row level security;
create policy "Public Access" on public."healthRecords" for all using (true);

alter table public."attendanceRecords" enable row level security;
create policy "Public Access" on public."attendanceRecords" for all using (true);

alter table public."activityRecords" enable row level security;
create policy "Public Access" on public."activityRecords" for all using (true);

alter table public."exitRecords" enable row level security;
create policy "Public Access" on public."exitRecords" for all using (true);

alter table public."academicRecords" enable row level security;
create policy "Public Access" on public."academicRecords" for all using (true);

alter table public."maintenanceRequests" enable row level security;
create policy "Public Access" on public."maintenanceRequests" for all using (true);

alter table public.settings enable row level security;
create policy "Public Access" on public.settings for all using (true);
