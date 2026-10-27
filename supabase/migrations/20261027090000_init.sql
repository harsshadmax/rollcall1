-- RollCall initial schema (Phase 4)
-- Manual-entry only: no ERP tables. Every user-owned table has RLS: user_id = auth.uid().
-- Rules: docs/sathyabama-rules.md · data model: blueprint.md §13 / ADR-001.

-- ---------- enums ----------
create type subject_kind as enum ('theory', 'lab', 'both');
create type session_status as enum ('present', 'absent', 'cancelled', 'unmarked');

-- ---------- helper: updated_at ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ================= grade scales (presets are global-readable) =================
create table grade_scales (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users on delete cascade,  -- null = global preset
  name text not null,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);

create table grade_points (
  id uuid primary key default gen_random_uuid(),
  grade_scale_id uuid not null references grade_scales on delete cascade,
  grade text not null,
  points numeric(4,2) not null,
  counts_in_gpa boolean not null default true,
  min_marks int,  -- inclusive lower bound of the mark band (null for non-mark grades)
  max_marks int,
  sort int not null default 0
);

-- Seed the official Sathyabama scale (docs/sathyabama-rules.md §16).
insert into grade_scales (id, owner_user_id, name, is_preset)
values ('00000000-0000-0000-0000-000000000001', null, 'Sathyabama (UG)', true);

insert into grade_points (grade_scale_id, grade, points, counts_in_gpa, min_marks, max_marks, sort) values
  ('00000000-0000-0000-0000-000000000001', 'A++', 10, true, 90, 100, 1),
  ('00000000-0000-0000-0000-000000000001', 'A+',  9,  true, 80, 89,  2),
  ('00000000-0000-0000-0000-000000000001', 'B++', 8,  true, 70, 79,  3),
  ('00000000-0000-0000-0000-000000000001', 'B+',  7,  true, 60, 69,  4),
  ('00000000-0000-0000-0000-000000000001', 'C',   6,  true, 50, 59,  5),
  ('00000000-0000-0000-0000-000000000001', 'RA',  0,  false, 0, 49,  6),
  ('00000000-0000-0000-0000-000000000001', 'ABS', 0,  false, null, null, 7),
  ('00000000-0000-0000-0000-000000000001', 'W',   0,  false, null, null, 8),
  ('00000000-0000-0000-0000-000000000001', 'AAA', 0,  false, null, null, 9);

-- ================= profiles =================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  threshold_theory numeric(3,2) not null default 0.80,
  threshold_practical numeric(3,2) not null default 1.00,
  grade_scale_id uuid references grade_scales on delete set null
    default '00000000-0000-0000-0000-000000000001',
  role text not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-create a profile row when a new auth user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ================= semesters =================
create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- at most one active semester per user
create unique index one_active_semester_per_user
  on semesters (user_id) where (is_active);

-- ================= subjects =================
create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  semester_id uuid not null references semesters on delete cascade,
  code text not null,
  name text not null,
  credits numeric(4,2) not null check (credits > 0),
  kind subject_kind not null default 'theory',
  color_token text,
  instructor text,
  room text,
  threshold_override numeric(3,2),  -- null = use the profile default for its kind
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================= periods (bell schedule) =================
create table periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  semester_id uuid not null references semesters on delete cascade,
  idx int not null,
  starts_at time not null,
  ends_at time not null,
  is_break boolean not null default false,
  check (ends_at > starts_at)
);

-- ================= timetable slots (weekly template) =================
create table timetable_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  semester_id uuid not null references semesters on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),  -- 1 = Monday
  period_id uuid not null references periods on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  room text,
  unique (user_id, semester_id, weekday, period_id)
);

-- ================= holidays / no-class days =================
create table no_class_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  semester_id uuid not null references semesters on delete cascade,
  day date not null,
  reason text,
  unique (user_id, semester_id, day)
);

-- ================= class sessions (one row per held class) =================
create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  slot_id uuid references timetable_slots on delete set null,
  period_id uuid references periods on delete set null,
  day date not null,
  status session_status not null default 'unmarked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject_id, day, period_id)
);
create index class_sessions_user_day on class_sessions (user_id, day);

-- ================= assessments (internal marks) =================
create table assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  name text not null,
  max_marks numeric(6,2) not null check (max_marks > 0),
  obtained numeric(6,2) check (obtained >= 0),
  weight numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ================= subject results (final grade per subject) =================
create table subject_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  grade text not null,
  attempt int not null default 1,
  unique (user_id, subject_id, attempt)
);

-- ================= personal events / tasks =================
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  color_token text,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
create trigger t_profiles_u before update on profiles for each row execute function set_updated_at();
create trigger t_semesters_u before update on semesters for each row execute function set_updated_at();
create trigger t_subjects_u before update on subjects for each row execute function set_updated_at();
create trigger t_sessions_u before update on class_sessions for each row execute function set_updated_at();
create trigger t_assess_u before update on assessments for each row execute function set_updated_at();
create trigger t_events_u before update on events for each row execute function set_updated_at();

-- ================= Row-Level Security =================
alter table profiles        enable row level security;
alter table semesters       enable row level security;
alter table subjects        enable row level security;
alter table periods         enable row level security;
alter table timetable_slots enable row level security;
alter table no_class_days   enable row level security;
alter table class_sessions  enable row level security;
alter table assessments     enable row level security;
alter table subject_results enable row level security;
alter table events          enable row level security;
alter table grade_scales    enable row level security;
alter table grade_points    enable row level security;

-- Profiles: a user sees and edits only their own row.
create policy profiles_self on profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- User-owned tables: full CRUD on own rows only. (same shape for each)
create policy semesters_own on semesters
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy subjects_own on subjects
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy periods_own on periods
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy slots_own on timetable_slots
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy noclass_own on no_class_days
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy sessions_own on class_sessions
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy assessments_own on assessments
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy results_own on subject_results
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy events_own on events
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Grade scales: everyone can read presets + their own; users manage only their own clones.
create policy grade_scales_read on grade_scales
  for select using (is_preset or owner_user_id = (select auth.uid()));
create policy grade_scales_write on grade_scales
  for all using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy grade_points_read on grade_points
  for select using (
    exists (select 1 from grade_scales gs
            where gs.id = grade_points.grade_scale_id
              and (gs.is_preset or gs.owner_user_id = (select auth.uid())))
  );
create policy grade_points_write on grade_points
  for all using (
    exists (select 1 from grade_scales gs
            where gs.id = grade_points.grade_scale_id and gs.owner_user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from grade_scales gs
            where gs.id = grade_points.grade_scale_id and gs.owner_user_id = (select auth.uid()))
  );
