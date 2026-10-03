-- =============================================================================
-- RA Learning Hub — Phase 2: Invitations & membership status
--
-- Invitations are sent through Supabase Auth (auth.admin.inviteUserByEmail);
-- this migration only tracks their state on `profiles` so admins can see who
-- is still pending, without exposing auth.users to the Data API.
--   invited_at  — when the (latest) invitation was sent (from auth.users)
--   invited_by  — who invited (from app_metadata, service-role controlled)
--   joined_at   — when the user accepted (auth.users.email_confirmed_at)
-- =============================================================================

alter table public.profiles
  add column invited_at timestamptz,
  add column invited_by uuid references auth.users (id) on delete set null,
  add column joined_at  timestamptz;

comment on column public.profiles.joined_at is
  'Set when the user first confirms their email (accepts the invitation). NULL = invitation pending.';

-- Existing confirmed users (e.g. created before this migration) count as joined.
update public.profiles p
set joined_at = u.email_confirmed_at,
    invited_at = u.invited_at
from auth.users u
where u.id = p.id;

-- -----------------------------------------------------------------------------
-- Provisioning: also record invitation / acceptance state.
-- -----------------------------------------------------------------------------
create or replace function private.assign_profile_from_app_metadata(target uuid, meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta_role    text := meta ->> 'role';
  meta_school  text := nullif(meta ->> 'school_id', '');
  meta_inviter text := nullif(meta ->> 'invited_by', '');
begin
  if meta_school is null then
    return;
  end if;

  update public.profiles p
  set school_id = meta_school::uuid,
      -- super_admin is never granted through metadata.
      role = case when meta_role = 'school_admin'
                  then 'school_admin'::public.user_role
                  else 'teacher'::public.user_role end,
      invited_by = coalesce(meta_inviter::uuid, p.invited_by)
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
  insert into public.profiles (id, email, full_name, invited_at, joined_at)
  values (
    new.id,
    new.email,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 150), ''),
    new.invited_at,
    new.email_confirmed_at
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

  if new.invited_at is distinct from old.invited_at then
    update public.profiles set invited_at = new.invited_at where id = new.id;
  end if;

  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
    set joined_at = new.email_confirmed_at
    where id = new.id and joined_at is null;
  end if;

  if new.raw_app_meta_data is distinct from old.raw_app_meta_data then
    perform private.assign_profile_from_app_metadata(new.id, new.raw_app_meta_data);
  end if;
  return new;
end;
$$;

drop trigger on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_app_meta_data, invited_at, email_confirmed_at on auth.users
  for each row execute function private.handle_updated_auth_user();

-- -----------------------------------------------------------------------------
-- Guard: invitation fields are system-managed (auth triggers / service role).
--
-- Now SECURITY INVOKER so `current_user` is the role performing the UPDATE:
--   * 'authenticated' → an end user via the Data API → enforce the rules;
--   * anything else (postgres via SECURITY DEFINER auth triggers,
--     service_role, supabase_auth_admin, migrations) → trusted system write.
-- This no longer depends on the request JWT being absent, so system triggers
-- fired inside a user's request are not blocked.
-- -----------------------------------------------------------------------------
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_role public.user_role;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  actor_role := private.auth_role();
  if actor_role = 'super_admin' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.school_id is distinct from old.school_id
     or new.email is distinct from old.email then
    raise exception 'Tidak diizinkan mengubah identitas atau sekolah akun.'
      using errcode = '42501';
  end if;

  if new.invited_at is distinct from old.invited_at
     or new.invited_by is distinct from old.invited_by
     or new.joined_at is distinct from old.joined_at then
    raise exception 'Status undangan dikelola oleh sistem.'
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

create index profiles_school_role_idx on public.profiles (school_id, role);
