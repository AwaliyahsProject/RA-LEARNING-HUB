-- =============================================================================
-- RA Learning Hub — Phase 1: Foundation
--
-- Creates the tenant root (`schools`), user profiles, role enum, RLS helper
-- functions and shared triggers. Every later school-owned table references
-- `schools.id` through a `school_id` column and reuses the helpers defined here.
--
-- Security model (see SECURITY.md):
--   * Tenant isolation is enforced by RLS, never by the frontend.
--   * Helper functions live in the `private` schema, which is NOT exposed via
--     the Supabase Data API, and run as SECURITY DEFINER with an empty
--     search_path so policies can read `profiles` without recursion.
--   * Role / school assignment comes from `auth.users.raw_app_meta_data`, which
--     only the service role can write. `raw_user_meta_data` is user-editable and
--     is only trusted for cosmetic fields (full_name).
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('super_admin', 'school_admin', 'teacher');

-- -----------------------------------------------------------------------------
-- Shared trigger: maintain updated_at / updated_by
-- -----------------------------------------------------------------------------
create or replace function private.set_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- schools — the tenant root
-- -----------------------------------------------------------------------------
create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 3 and 200),
  npsn        text check (npsn ~ '^[0-9]{8}$'),
  nsm         text check (nsm ~ '^[0-9]{12}$'),
  address     text,
  village     text,
  district    text,
  regency     text,
  province    text,
  phone       text,
  email       text,
  logo_url    text,
  -- Indonesia spans WIB / WITA / WIT; dates like "today's lesson" depend on it.
  timezone    text not null default 'Asia/Jakarta'
              check (timezone in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null
);

comment on table public.schools is 'Tenant root. Every school-owned row references schools.id via school_id.';

create trigger schools_audit
  before insert or update on public.schools
  for each row execute function private.set_audit_fields();

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user (profiles.id = auth.users.id)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 150),
  email       text,
  avatar_url  text,
  role        public.user_role not null default 'teacher',
  school_id   uuid references public.schools (id) on delete restrict,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  -- Super admins are platform-level and never belong to a tenant.
  constraint profiles_super_admin_has_no_school
    check (role <> 'super_admin' or school_id is null)
);

comment on table public.profiles is
  'Application profile for each auth user. A non-super-admin without school_id has no tenant access until assigned.';

create index profiles_school_id_idx on public.profiles (school_id);

create trigger profiles_audit
  before insert or update on public.profiles
  for each row execute function private.set_audit_fields();

-- -----------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER, bypass RLS on profiles to avoid
-- policy recursion). Only active profiles grant any access.
-- -----------------------------------------------------------------------------
create or replace function private.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.is_active
$$;

create or replace function private.auth_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id
  from public.profiles p
  where p.id = auth.uid() and p.is_active
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.auth_role() = 'super_admin', false)
$$;

create or replace function private.is_school_admin_of(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.auth_role() = 'school_admin'
      and private.auth_school_id() = target_school,
    false
  )
$$;

create or replace function private.is_member_of(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    target_school is not null and private.auth_school_id() = target_school,
    false
  )
$$;

revoke all on all functions in schema private from public;
grant execute on function
  private.auth_role(),
  private.auth_school_id(),
  private.is_super_admin(),
  private.is_school_admin_of(uuid),
  private.is_member_of(uuid)
to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Guard against privilege escalation on profiles.
-- RLS decides WHICH rows a user may update; this trigger decides WHICH
-- columns may change. Direct database sessions without a JWT (migrations,
-- SQL editor, service role) have auth.uid() = null and are trusted.
-- -----------------------------------------------------------------------------
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.auth_role();
begin
  if auth.uid() is null or actor_role = 'super_admin' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.school_id is distinct from old.school_id
     or new.email is distinct from old.email then
    raise exception 'Tidak diizinkan mengubah identitas atau sekolah akun.'
      using errcode = '42501';
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if actor_role <> 'school_admin'
       or old.id = auth.uid()
       or old.role = 'super_admin'
       or new.role = 'super_admin' then
      raise exception 'Tidak diizinkan mengubah peran atau status akun.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function private.guard_profile_update();

-- -----------------------------------------------------------------------------
-- Profile provisioning from auth.users.
--
-- Role & school come from app_metadata (writable only by the service role).
-- GoTrue inserts the user first and writes custom app_metadata in a follow-up
-- UPDATE, so assignment runs on both INSERT and UPDATE. Assignment happens
-- ONCE: only while the profile has no school yet. Afterwards `profiles` is the
-- source of truth (e.g. a school admin changing a teacher's role is never
-- overwritten by later app_metadata writes such as provider linking).
-- -----------------------------------------------------------------------------
create or replace function private.assign_profile_from_app_metadata(target uuid, meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta_role   text := meta ->> 'role';
  meta_school text := nullif(meta ->> 'school_id', '');
begin
  if meta_school is null then
    return;
  end if;

  update public.profiles p
  set school_id = meta_school::uuid,
      -- super_admin is never granted through metadata.
      role = case when meta_role = 'school_admin'
                  then 'school_admin'::public.user_role
                  else 'teacher'::public.user_role end
  where p.id = target
    and p.school_id is null
    and p.role <> 'super_admin';
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 150), '')
  );
  perform private.assign_profile_from_app_metadata(new.id, new.raw_app_meta_data);
  return new;
end;
$$;

create or replace function private.handle_updated_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  if new.raw_app_meta_data is distinct from old.raw_app_meta_data then
    perform private.assign_profile_from_app_metadata(new.id, new.raw_app_meta_data);
  end if;
  return new;
end;
$$;

revoke all on function
  private.assign_profile_from_app_metadata(uuid, jsonb),
  private.handle_new_auth_user(),
  private.handle_updated_auth_user()
from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create trigger on_auth_user_updated
  after update of email, raw_app_meta_data on auth.users
  for each row execute function private.handle_updated_auth_user();

-- -----------------------------------------------------------------------------
-- Privileges: anon gets nothing. authenticated gets table privileges that
-- RLS then narrows row by row.
-- -----------------------------------------------------------------------------
revoke all on public.schools, public.profiles from anon;
grant select, insert, update, delete on public.schools to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.schools, public.profiles to service_role;

-- -----------------------------------------------------------------------------
-- RLS: schools
-- -----------------------------------------------------------------------------
alter table public.schools enable row level security;

create policy schools_select on public.schools
  for select to authenticated
  using (private.is_super_admin() or private.is_member_of(id));

create policy schools_insert on public.schools
  for insert to authenticated
  with check (private.is_super_admin());

create policy schools_update on public.schools
  for update to authenticated
  using (private.is_super_admin() or private.is_school_admin_of(id))
  with check (private.is_super_admin() or private.is_school_admin_of(id));

create policy schools_delete on public.schools
  for delete to authenticated
  using (private.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS: profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or private.is_super_admin()
    or private.is_member_of(school_id)
  );

-- Profiles are created by the auth trigger; only super admins insert directly.
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (private.is_super_admin());

create policy profiles_update on public.profiles
  for update to authenticated
  using (
    id = auth.uid()
    or private.is_super_admin()
    or private.is_school_admin_of(school_id)
  )
  with check (
    id = auth.uid()
    or private.is_super_admin()
    or private.is_school_admin_of(school_id)
  );

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (private.is_super_admin());
