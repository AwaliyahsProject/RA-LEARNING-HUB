-- =============================================================================
-- Tenant isolation & role escalation tests for schools / profiles.
-- Runs inside a single transaction that is rolled back at the end.
-- Pattern per scenario: `reset role;` → tests.login_as(<user>) → assertions.
-- =============================================================================
begin;

-- ---------------------------------------------------------------- fixtures --
insert into public.schools (id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'RA Sekolah A'),
  ('b0000000-0000-0000-0000-000000000002', 'RA Sekolah B');

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin.a@test.id',
     '{"role":"school_admin","school_id":"a0000000-0000-0000-0000-000000000001"}', '{"full_name":"Admin A"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'guru.a@test.id',
     '{"role":"teacher","school_id":"a0000000-0000-0000-0000-000000000001"}', '{"full_name":"Guru A"}'),
  ('00000000-0000-0000-0000-00000000000b', 'admin.b@test.id',
     '{"role":"school_admin","school_id":"b0000000-0000-0000-0000-000000000002"}', '{}'),
  ('00000000-0000-0000-0000-0000000000b1', 'guru.b@test.id',
     '{"role":"teacher","school_id":"b0000000-0000-0000-0000-000000000002"}', '{}'),
  -- Self-signup style user trying to claim super_admin via app metadata is downgraded.
  ('00000000-0000-0000-0000-0000000000ff', 'nakal@test.id',
     '{"role":"super_admin"}', '{}'),
  ('00000000-0000-0000-0000-000000000005', 'owner@test.id', '{}', '{}');

-- Super admin is promoted out-of-band (SQL editor / service role).
update public.profiles set role = 'super_admin'
where id = '00000000-0000-0000-0000-000000000005';

select tests.assert_equals(
  (select count(*)::int from public.profiles), 6, 'trigger creates a profile per auth user');
select tests.assert_equals(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000ff'),
  'teacher', 'app_metadata role super_admin is never granted by the trigger');
select tests.assert_equals(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'Guru A', 'full_name copied from user metadata');

-- GoTrue-style provisioning: user inserted bare, app_metadata written after.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c1', 'undangan@test.id');
update auth.users
set raw_app_meta_data = '{"provider":"email","role":"school_admin","school_id":"a0000000-0000-0000-0000-000000000001"}'
where id = '00000000-0000-0000-0000-0000000000c1';
select tests.assert_equals(
  (select school_id from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'),
  'a0000000-0000-0000-0000-000000000001'::uuid, 'app_metadata written after insert assigns the school');
select tests.assert_equals(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'),
  'school_admin', 'app_metadata written after insert assigns the role');
-- Later metadata writes never re-assign an already-assigned profile.
update public.profiles set role = 'teacher' where id = '00000000-0000-0000-0000-0000000000c1';
update auth.users
set raw_app_meta_data = '{"provider":"email","providers":["email","google"],"role":"school_admin","school_id":"b0000000-0000-0000-0000-000000000002"}'
where id = '00000000-0000-0000-0000-0000000000c1';
select tests.assert_equals(
  (select role::text || ':' || school_id::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'),
  'teacher:a0000000-0000-0000-0000-000000000001', 'assignment happens only once (profiles stays source of truth)');
update auth.users set email = 'undangan.baru@test.id' where id = '00000000-0000-0000-0000-0000000000c1';
select tests.assert_equals(
  (select email from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'),
  'undangan.baru@test.id', 'email change in auth is synced to profiles');
delete from auth.users where id = '00000000-0000-0000-0000-0000000000c1';

-- ------------------------------------------------------------------ anon --
reset role;
select tests.login_as(null);
select tests.assert_throws('select * from public.schools', 'anon cannot read schools');
select tests.assert_throws('select * from public.profiles', 'anon cannot read profiles');

-- ------------------------------------------------------------ teacher A --
reset role;
select tests.login_as('00000000-0000-0000-0000-0000000000a1');
select tests.assert_equals((select count(*)::int from public.schools), 1, 'teacher A sees exactly one school');
select tests.assert_equals(
  (select id from public.schools limit 1), 'a0000000-0000-0000-0000-000000000001'::uuid,
  'teacher A sees only own school');
select tests.assert_equals(
  (select count(*)::int from public.profiles where school_id = 'b0000000-0000-0000-0000-000000000002'),
  0, 'teacher A cannot read School B profiles');
select tests.assert_equals(
  (select count(*)::int from public.profiles), 2, 'teacher A sees only colleagues of School A');
select tests.assert_rows_affected(
  $$update public.schools set name = 'Diretas' where id = 'b0000000-0000-0000-0000-000000000002'$$,
  0, 'teacher A cannot update School B');
select tests.assert_rows_affected(
  $$update public.schools set name = 'Diubah Guru' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  0, 'teacher A cannot update own school profile (admin only)');
select tests.assert_rows_affected(
  $$update public.profiles set full_name = 'Guru A Baru' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  1, 'teacher A can update own name');
select tests.assert_throws(
  $$update public.profiles set role = 'school_admin' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'teacher A cannot promote self');
select tests.assert_throws(
  $$update public.profiles set school_id = 'b0000000-0000-0000-0000-000000000002' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'teacher A cannot move self to School B');
select tests.assert_rows_affected(
  $$update public.profiles set full_name = 'Diretas' where id = '00000000-0000-0000-0000-00000000000a'$$,
  0, 'teacher A cannot edit a colleague profile');
select tests.assert_throws(
  $$insert into public.schools (name) values ('Sekolah Liar')$$, 'teacher cannot create schools');
select tests.assert_rows_affected(
  $$delete from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'$$,
  0, 'teacher A cannot delete School B profile');

-- ------------------------------------------------------- school admin A --
reset role;
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select tests.assert_rows_affected(
  $$update public.schools set phone = '0812000000' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  1, 'admin A can update own school');
select tests.assert_rows_affected(
  $$update public.schools set phone = '0812000000' where id = 'b0000000-0000-0000-0000-000000000002'$$,
  0, 'admin A cannot update School B');
select tests.assert_rows_affected(
  $$update public.profiles set is_active = false where id = '00000000-0000-0000-0000-0000000000b1'$$,
  0, 'admin A cannot deactivate School B teacher');
select tests.assert_throws(
  $$update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'admin A cannot grant super_admin');
select tests.assert_throws(
  $$update public.profiles set school_id = 'b0000000-0000-0000-0000-000000000002' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'admin A cannot move a teacher to another school');
select tests.assert_throws(
  $$update public.profiles set role = 'teacher' where id = '00000000-0000-0000-0000-00000000000a'$$,
  'admin A cannot change own role');
select tests.assert_rows_affected(
  $$update public.profiles set role = 'school_admin' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  1, 'admin A can promote own teacher to school_admin');
select tests.assert_throws(
  $$update public.schools set id = gen_random_uuid() where id = 'a0000000-0000-0000-0000-000000000001'$$,
  'admin A cannot change the school id');

-- -------------------------------------------- deactivated account (A1) --
reset role;
update public.profiles set is_active = false where id = '00000000-0000-0000-0000-0000000000a1';
select tests.login_as('00000000-0000-0000-0000-0000000000a1');
select tests.assert_equals((select count(*)::int from public.schools), 0, 'deactivated user sees no schools');

-- ------------------------------------------------ unassigned user (ff) --
reset role;
select tests.login_as('00000000-0000-0000-0000-0000000000ff');
select tests.assert_equals((select count(*)::int from public.schools), 0, 'user without school sees no schools');
select tests.assert_equals((select count(*)::int from public.profiles), 1, 'user without school sees only self');

-- ----------------------------------------------------------- super admin --
reset role;
select tests.login_as('00000000-0000-0000-0000-000000000005');
select tests.assert_equals((select count(*)::int from public.schools), 2, 'super admin sees all schools');
select tests.assert_rows_affected(
  $$insert into public.schools (name) values ('RA Sekolah C')$$, 1, 'super admin can create schools');
select tests.assert_equals(
  (select created_by from public.schools where name = 'RA Sekolah C'),
  '00000000-0000-0000-0000-000000000005'::uuid, 'audit: created_by is set from auth.uid()');

reset role;
select tests.assert_throws(
  $$update public.profiles set school_id = 'a0000000-0000-0000-0000-000000000001' where id = '00000000-0000-0000-0000-000000000005'$$,
  'super admin cannot be bound to a school (check constraint)');

rollback;
