-- =============================================================================
-- Phase 3: academic years, classes, class teachers, logo storage.
-- =============================================================================
begin;

insert into public.schools (id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'RA Sekolah A'),
  ('b0000000-0000-0000-0000-000000000002', 'RA Sekolah B');

insert into auth.users (id, email, raw_app_meta_data, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'admin.a@test.id', '{"role":"school_admin","school_id":"a0000000-0000-0000-0000-000000000001"}', now()),
  ('00000000-0000-0000-0000-0000000000a1', 'guru.a1@test.id', '{"role":"teacher","school_id":"a0000000-0000-0000-0000-000000000001"}', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'guru.a2@test.id', '{"role":"teacher","school_id":"a0000000-0000-0000-0000-000000000001"}', now()),
  ('00000000-0000-0000-0000-00000000000b', 'admin.b@test.id', '{"role":"school_admin","school_id":"b0000000-0000-0000-0000-000000000002"}', now()),
  ('00000000-0000-0000-0000-0000000000b1', 'guru.b1@test.id', '{"role":"teacher","school_id":"b0000000-0000-0000-0000-000000000002"}', now());

insert into public.academic_years (id, school_id, name, start_date, end_date, is_active) values
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '2026/2027', '2026-07-13', '2027-06-25', true);
insert into public.classes (id, school_id, academic_year_id, name, level) values
  ('bc000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Kelompok B1', 'B');

-- ---------------------------------------------------- school admin A --
reset role;
select tests.login_as('00000000-0000-0000-0000-00000000000a');

select tests.assert_rows_affected(
  $$insert into public.academic_years (id, school_id, name, start_date, end_date)
    values ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2025/2026', '2025-07-14', '2026-06-26'),
           ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '2026/2027', '2026-07-13', '2027-06-25')$$,
  2, 'admin A creates academic years');
select tests.assert_throws(
  $$insert into public.academic_years (school_id, name, start_date, end_date)
    values ('b0000000-0000-0000-0000-000000000002', '2030/2031', '2030-07-01', '2031-06-30')$$,
  'admin A cannot create a year for School B');
select tests.assert_throws(
  $$insert into public.academic_years (school_id, name, start_date, end_date)
    values ('a0000000-0000-0000-0000-000000000001', '2027/2028', '2028-06-30', '2027-07-01')$$,
  'end date must be after start date');
select tests.assert_throws(
  $$insert into public.academic_years (school_id, name, start_date, end_date)
    values ('a0000000-0000-0000-0000-000000000001', 'Tahun Ini', '2027-07-01', '2028-06-30')$$,
  'year name must look like 2027/2028');

select public.set_active_academic_year('a1000000-0000-0000-0000-000000000001');
select public.set_active_academic_year('a1000000-0000-0000-0000-000000000002');
select tests.assert_equals(
  (select string_agg(name, ',') from public.academic_years where is_active and school_id = 'a0000000-0000-0000-0000-000000000001'),
  '2026/2027', 'switching active year leaves exactly one active');
select tests.assert_throws(
  $$update public.academic_years set is_active = true where id = 'a1000000-0000-0000-0000-000000000001'$$,
  'database rejects two active years in one school');
select tests.assert_throws(
  $$select public.set_active_academic_year('b1000000-0000-0000-0000-000000000001')$$,
  'admin A cannot switch School B active year');

select tests.assert_rows_affected(
  $$insert into public.classes (id, school_id, academic_year_id, name, level)
    values ('ac000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Kelompok A1', 'A')$$,
  1, 'admin A creates a class');
select tests.assert_throws(
  $$insert into public.classes (school_id, academic_year_id, name, level)
    values ('a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Nyasar', 'A')$$,
  'class cannot point at another school''s academic year (composite FK)');
select tests.assert_throws(
  $$insert into public.classes (school_id, academic_year_id, name, level)
    values ('a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Kelompok A1', 'A')$$,
  'class names are unique within an academic year');

select tests.assert_rows_affected(
  $$insert into public.class_teachers (school_id, class_id, teacher_id, role)
    values ('a0000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'homeroom')$$,
  1, 'admin A assigns a homeroom teacher');
select tests.assert_throws(
  $$insert into public.class_teachers (school_id, class_id, teacher_id, role)
    values ('a0000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'homeroom')$$,
  'only one homeroom teacher per class');
select tests.assert_throws(
  $$insert into public.class_teachers (school_id, class_id, teacher_id, role)
    values ('a0000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'assistant')$$,
  'School B teacher cannot be assigned to a School A class (composite FK)');
select tests.assert_throws(
  $$delete from public.academic_years where id = 'a1000000-0000-0000-0000-000000000002'$$,
  'academic year with classes cannot be deleted');
select tests.assert_rows_affected(
  $$update public.classes set name = 'Diretas' where id = 'bc000000-0000-0000-0000-000000000001'$$,
  0, 'admin A cannot rename School B class');

-- Storage: logos
select tests.assert_rows_affected(
  $$insert into storage.objects (bucket_id, name) values ('school-logos', 'a0000000-0000-0000-0000-000000000001/logo-1.png')$$,
  1, 'admin A uploads logo into own school folder');
select tests.assert_throws(
  $$insert into storage.objects (bucket_id, name) values ('school-logos', 'b0000000-0000-0000-0000-000000000002/logo-1.png')$$,
  'admin A cannot upload into School B folder');
select tests.assert_throws(
  $$insert into storage.objects (bucket_id, name) values ('school-logos', 'bukan-uuid/logo.png')$$,
  'malformed logo path is rejected');

-- ------------------------------------------------------------ teacher A1 --
reset role;
select tests.login_as('00000000-0000-0000-0000-0000000000a1');
select tests.assert_equals((select count(*)::int from public.academic_years), 2, 'teacher A sees only School A years');
select tests.assert_equals((select count(*)::int from public.classes), 1, 'teacher A sees only School A classes');
select tests.assert_equals((select count(*)::int from public.class_teachers where school_id = 'b0000000-0000-0000-0000-000000000002'), 0, 'teacher A cannot see School B assignments');
select tests.assert_throws(
  $$insert into public.classes (school_id, academic_year_id, name, level)
    values ('a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Kelas Guru', 'B')$$,
  'teacher cannot create classes');
select tests.assert_rows_affected(
  $$delete from public.class_teachers$$, 0, 'teacher cannot remove class assignments');
select tests.assert_throws(
  $$select public.set_active_academic_year('a1000000-0000-0000-0000-000000000001')$$,
  'teacher cannot switch the active year');
select tests.assert_throws(
  $$insert into storage.objects (bucket_id, name) values ('school-logos', 'a0000000-0000-0000-0000-000000000001/logo-2.png')$$,
  'teacher cannot upload a logo');
select tests.assert_equals(private.teaches_class('ac000000-0000-0000-0000-000000000001'), true, 'teaches_class: assigned teacher');

reset role;
select tests.login_as('00000000-0000-0000-0000-0000000000a2');
select tests.assert_equals(private.teaches_class('ac000000-0000-0000-0000-000000000001'), false, 'teaches_class: unassigned teacher');

-- ------------------------------------------------------------ anon --
reset role;
select tests.login_as(null);
select tests.assert_throws('select * from public.classes', 'anon cannot read classes');

rollback;
