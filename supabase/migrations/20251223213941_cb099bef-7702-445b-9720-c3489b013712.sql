-- 1. Core enums
create type public.app_role as enum ('admin', 'school', 'parent', 'student');

create type public.project_visibility as enum ('public', 'private');

create type public.media_type as enum ('web_app', 'chatbot', 'design', 'image', 'video', 'audio', 'other');

create type public.payment_status as enum ('pending', 'verified', 'failed', 'refunded');

create type public.approval_status as enum ('pending', 'approved', 'rejected');

-- 2. User roles table and helper
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

create policy "Users can read their own roles" on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- 3. Schools, parents, students and relationships
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique, -- optional login owner for the school
  name text not null,
  short_code text,
  contact_name text,
  contact_email text,
  contact_phone text,
  city text,
  state text,
  country text default 'Nigeria',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schools enable row level security;

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parents enable row level security;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique, -- optional login for student
  full_name text not null,
  date_of_birth date,
  school_id uuid references public.schools(id) on delete set null,
  class_level text,
  batch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students enable row level security;

create table public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship text,
  unique (parent_id, student_id)
);

alter table public.parent_students enable row level security;

-- 4. Learning artefacts: projects & assignments
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  title text not null,
  description text,
  media_type media_type not null default 'web_app',
  visibility project_visibility not null default 'private',
  external_url text,
  thumbnail_url text,
  cohort text,
  is_school_gallery boolean not null default false,
  is_public_gallery boolean not null default false,
  approved_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  status text default 'assigned',
  instructor_feedback text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

-- 5. Payments & approvals
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null,
  currency text not null default 'NGN',
  status payment_status not null default 'pending',
  provider text not null default 'paystack',
  provider_reference text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  status approval_status not null default 'pending',
  reason text,
  decided_by uuid, -- admin user id
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

alter table public.approvals enable row level security;

-- 6. Basic timestamp trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_schools_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();

create trigger set_parents_updated_at
before update on public.parents
for each row
execute function public.set_updated_at();

create trigger set_students_updated_at
before update on public.students
for each row
execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_assignments_updated_at
before update on public.assignments
for each row
execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

-- 7. Row Level Security policies

-- Schools: school owner or admin can manage, others cannot
create policy "School owners read their school" on public.schools
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "School owners manage their school" on public.schools
for all
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Parents: parent or admin
create policy "Parents read their profile" on public.parents
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Parents manage their profile" on public.parents
for all
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Students: student, linked parents, school owner, or admin can read
create policy "Students read access" on public.students
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.parent_students ps
    join public.parents p on ps.parent_id = p.id
    where ps.student_id = students.id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.schools s
    where s.id = students.school_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- For now, only school owners and admins can insert/update/delete students
create policy "Schools manage their students" on public.students
for all
to authenticated
using (
  exists (
    select 1 from public.schools s
    where s.id = students.school_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1 from public.schools s
    where s.id = students.school_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- Parent-student links: parents can see their own links, schools can see links for their students, admins see all
create policy "Parents read their links" on public.parent_students
for select
to authenticated
using (
  exists (
    select 1 from public.parents p
    where p.id = parent_students.parent_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1 from public.students st
    join public.schools s on st.school_id = s.id
    where st.id = parent_students.student_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- For now, only admins manage parent-student links via backend
create policy "Admins manage parent-student links" on public.parent_students
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Projects
-- Public gallery: everyone (including anonymous) can read selected public projects
create policy "Public can read approved public projects" on public.projects
for select
using (
  visibility = 'public'
  and approved_by_admin = true
  and is_public_gallery = true
);

-- Authenticated: student, parent, school owner, admin read related projects (including private)
create policy "Related users read projects" on public.projects
for select
to authenticated
using (
  exists (
    select 1 from public.students st
    where st.id = projects.student_id
      and st.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.parent_students ps
    join public.parents p on ps.parent_id = p.id
    where ps.student_id = projects.student_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.schools s
    where s.id = projects.school_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- Students can create/update their own projects; schools and admins can manage projects tied to their school
create policy "Students and schools manage projects" on public.projects
for all
to authenticated
using (
  exists (
    select 1 from public.students st
    where st.id = projects.student_id
      and st.user_id = auth.uid()
  )
  or exists (
    select 1 from public.schools s
    where s.id = projects.school_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1 from public.students st
    where st.id = projects.student_id
      and st.user_id = auth.uid()
  )
  or exists (
    select 1 from public.schools s
    where s.id = projects.school_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- Assignments: related student, their parents, school owner, admin
create policy "Related users read assignments" on public.assignments
for select
to authenticated
using (
  exists (
    select 1 from public.students st
    where st.id = assignments.student_id
      and st.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.parent_students ps
    join public.parents p on ps.parent_id = p.id
    where ps.student_id = assignments.student_id
      and p.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.schools s
    join public.students st on st.school_id = s.id
    where st.id = assignments.student_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- For now, only school owners and admins can create/manage assignments
create policy "Schools manage assignments" on public.assignments
for all
to authenticated
using (
  exists (
    select 1
    from public.schools s
    join public.students st on st.school_id = s.id
    where st.id = assignments.student_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1
    from public.schools s
    join public.students st on st.school_id = s.id
    where st.id = assignments.student_id
      and s.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

-- Payments: users can see their own payments, admins can see all
create policy "Users read their payments" on public.payments
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Users manage their payments" on public.payments
for all
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Approvals: user can see their approvals, admins manage all
create policy "Users read their approvals" on public.approvals
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage approvals" on public.approvals
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
