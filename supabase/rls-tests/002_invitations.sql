-- =============================================================================
-- Phase 2: invitation state on profiles.
-- =============================================================================
begin;

insert into public.schools (id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'RA Sekolah A'),
  ('b0000000-0000-0000-0000-000000000002', 'RA Sekolah B');

-- Confirmed school admin (accepted earlier).
insert into auth.users (id, email, raw_app_meta_data, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'admin.a@test.id',
   '{"role":"school_admin","school_id":"a0000000-0000-0000-0000-000000000001"}', now());

select tests.assert_equals(
  (select joined_at is not null from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  true, 'user created already confirmed counts as joined');

-- GoTrue invite: bare insert with invited_at, then app_metadata update.
insert into auth.users (id, email, invited_at, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000a1', 'guru.a@test.id', now(), '{"full_name":"Guru A"}');
update auth.users
set raw_app_meta_data = jsonb_build_object(
  'provider', 'email', 'role', 'teacher',
  'school_id', 'a0000000-0000-0000-0000-000000000001',
  'invited_by', '00000000-0000-0000-0000-00000000000a')
where id = '00000000-0000-0000-0000-0000000000a1';

select tests.assert_equals(
  (select invited_at is not null and joined_at is null from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  true, 'invited user is pending (invited_at set, joined_at null)');
select tests.assert_equals(
  (select invited_by from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  '00000000-0000-0000-0000-00000000000a'::uuid, 'invited_by recorded from app_metadata');

-- Teacher B in another school, still pending.
insert into auth.users (id, email, invited_at, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', 'guru.b@test.id', now(),
   '{"role":"teacher","school_id":"b0000000-0000-0000-0000-000000000002"}');

-- --------------------------------------------------------- guard checks --
reset role;
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select tests.assert_throws(
  $$update public.profiles set joined_at = now() where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'school admin cannot fake invitation acceptance');
select tests.assert_throws(
  $$update public.profiles set invited_by = null where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'school admin cannot rewrite invited_by');
select tests.assert_equals(
  (select count(*)::int from public.profiles where joined_at is null),
  1, 'school admin sees only own pending invitations');
select tests.assert_rows_affected(
  $$update public.profiles set is_active = false where id = '00000000-0000-0000-0000-0000000000a1'$$,
  1, 'school admin can deactivate own teacher');
select tests.assert_rows_affected(
  $$update public.profiles set is_active = false where id = '00000000-0000-0000-0000-0000000000b1'$$,
  0, 'school admin cannot deactivate other school teacher');

-- ---------------------------------------------------- acceptance sync --
reset role;
update public.profiles set is_active = true where id = '00000000-0000-0000-0000-0000000000a1';
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-0000000000a1';
select tests.assert_equals(
  (select joined_at is not null from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  true, 'confirming email marks the profile as joined');

-- Re-sending an invitation updates invited_at.
update auth.users set invited_at = '2030-01-01T00:00:00Z' where id = '00000000-0000-0000-0000-0000000000b1';
select tests.assert_equals(
  (select invited_at from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'),
  '2030-01-01T00:00:00Z'::timestamptz, 'resent invitation updates invited_at');

rollback;
