-- =============================================================================
-- RA Learning Hub — Phase 3: academic years, classes (Kelompok A/B),
-- class teachers and school logos.
--
-- Tenant integrity: child rows carry school_id AND reference their parent via
-- a composite (id, school_id) foreign key, so the database itself rejects
-- cross-school links (e.g. a School B teacher on a School A class) even if an
-- application bug tried to create one.
-- =============================================================================

-- Allow composite FKs (teacher_id, school_id) → profiles.
alter table public.profiles
  add constraint profiles_id_school_key unique (id, school_id);

create type public.class_level as enum ('A', 'B');
create type public.class_teacher_role as enum ('homeroom', 'assistant');

-- -----------------------------------------------------------------------------
-- academic_years
-- -----------------------------------------------------------------------------
create table public.academic_years (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete restrict,
  name        text not null check (name ~ '^[0-9]{4}/[0-9]{4}$'),
  start_date  date not null,
  end_date    date not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  constraint academic_years_dates_check check (end_date > start_date),
  constraint academic_years_school_name_key unique (school_id, name),
  constraint academic_years_id_school_key unique (id, school_id)
);

comment on table public.academic_years is 'Tahun ajaran per sekolah. Maksimal satu yang aktif per sekolah.';

-- At most one active academic year per school.
create unique index academic_years_one_active_idx
  on public.academic_years (school_id) where is_active;

create trigger academic_years_audit
  before insert or update on public.academic_years
  for each row execute function private.set_audit_fields();

-- -----------------------------------------------------------------------------
-- classes
-- learning_model_id is added in Phase 7 together with learning_models.
-- -----------------------------------------------------------------------------
create table public.classes (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools (id) on delete restrict,
  academic_year_id  uuid not null,
  name              text not null check (char_length(btrim(name)) between 1 and 60),
  level             public.class_level not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  updated_by        uuid references auth.users (id) on delete set null,
  constraint classes_academic_year_fkey
    foreign key (academic_year_id, school_id)
    references public.academic_years (id, school_id) on delete restrict,
  constraint classes_year_name_key unique (academic_year_id, name),
  constraint classes_id_school_key unique (id, school_id)
);

comment on table public.classes is 'Kelas/rombel per tahun ajaran. level = kelompok usia A atau B.';

create index classes_school_year_idx on public.classes (school_id, academic_year_id);

create trigger classes_audit
  before insert or update on public.classes
  for each row execute function private.set_audit_fields();

-- -----------------------------------------------------------------------------
-- class_teachers — homeroom (wali kelas, max one) + assistants (pendamping)
-- -----------------------------------------------------------------------------
create table public.class_teachers (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null,
  class_id    uuid not null,
  teacher_id  uuid not null,
  role        public.class_teacher_role not null default 'assistant',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  constraint class_teachers_class_fkey
    foreign key (class_id, school_id) references public.classes (id, school_id) on delete cascade,
  constraint class_teachers_teacher_fkey
    foreign key (teacher_id, school_id) references public.profiles (id, school_id) on delete cascade,
  constraint class_teachers_class_teacher_key unique (class_id, teacher_id)
);

create unique index class_teachers_one_homeroom_idx
  on public.class_teachers (class_id) where role = 'homeroom';
create index class_teachers_teacher_idx on public.class_teachers (teacher_id);

create trigger class_teachers_audit
  before insert or update on public.class_teachers
  for each row execute function private.set_audit_fields();

-- -----------------------------------------------------------------------------
-- Helper for later phases: is the current user assigned to this class?
-- (Phase 4+ uses it to limit teachers to their own classes' students.)
-- -----------------------------------------------------------------------------
create or replace function private.teaches_class(target_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_teachers ct
    join public.profiles p on p.id = ct.teacher_id
    where ct.class_id = target_class
      and ct.teacher_id = auth.uid()
      and p.is_active
  )
$$;

revoke all on function private.teaches_class(uuid) from public;
grant execute on function private.teaches_class(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Privileges + RLS: members read; school admins (and super admins) write.
-- -----------------------------------------------------------------------------
revoke all on public.academic_years, public.classes, public.class_teachers from anon;
grant select, insert, update, delete on public.academic_years, public.classes, public.class_teachers to authenticated;
grant all on public.academic_years, public.classes, public.class_teachers to service_role;

alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;

create policy academic_years_select on public.academic_years
  for select to authenticated
  using (private.is_super_admin() or private.is_member_of(school_id));
create policy academic_years_write on public.academic_years
  for all to authenticated
  using (private.is_super_admin() or private.is_school_admin_of(school_id))
  with check (private.is_super_admin() or private.is_school_admin_of(school_id));

create policy classes_select on public.classes
  for select to authenticated
  using (private.is_super_admin() or private.is_member_of(school_id));
create policy classes_write on public.classes
  for all to authenticated
  using (private.is_super_admin() or private.is_school_admin_of(school_id))
  with check (private.is_super_admin() or private.is_school_admin_of(school_id));

create policy class_teachers_select on public.class_teachers
  for select to authenticated
  using (private.is_super_admin() or private.is_member_of(school_id));
create policy class_teachers_write on public.class_teachers
  for all to authenticated
  using (private.is_super_admin() or private.is_school_admin_of(school_id))
  with check (private.is_super_admin() or private.is_school_admin_of(school_id));

-- -----------------------------------------------------------------------------
-- RPC: atomically switch the active academic year.
-- SECURITY INVOKER — RLS still applies to both updates.
-- -----------------------------------------------------------------------------
create or replace function public.set_active_academic_year(target uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_school uuid;
begin
  select ay.school_id into target_school from public.academic_years ay where ay.id = target;

  if target_school is null
     or not (private.is_super_admin() or private.is_school_admin_of(target_school)) then
    raise exception 'Tidak diizinkan mengubah tahun ajaran aktif.' using errcode = '42501';
  end if;

  update public.academic_years
  set is_active = false
  where school_id = target_school and is_active and id <> target;

  update public.academic_years set is_active = true where id = target;
end;
$$;

revoke all on function public.set_active_academic_year(uuid) from public, anon;
grant execute on function public.set_active_academic_year(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: public bucket for school logos (logos are public information and
-- appear on printed documents). Path: {school_id}/logo-{timestamp}.{ext}.
-- schools.logo_url stores the object PATH inside this bucket, not a full URL.
-- Sensitive files (student photos, portfolio) will use a PRIVATE bucket.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-logos', 'school-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- First path segment as uuid, or NULL when it is not a uuid.
create or replace function private.path_school_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return (string_to_array(object_name, '/'))[1]::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

grant execute on function private.path_school_id(text) to authenticated, service_role;

create policy school_logos_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'school-logos'
         and (private.is_super_admin() or private.is_school_admin_of(private.path_school_id(name))));

create policy school_logos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'school-logos'
              and (private.is_super_admin() or private.is_school_admin_of(private.path_school_id(name))));

create policy school_logos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'school-logos'
         and (private.is_super_admin() or private.is_school_admin_of(private.path_school_id(name))))
  with check (bucket_id = 'school-logos'
              and (private.is_super_admin() or private.is_school_admin_of(private.path_school_id(name))));

create policy school_logos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'school-logos'
         and (private.is_super_admin() or private.is_school_admin_of(private.path_school_id(name))));
