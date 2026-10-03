-- Tiny assertion helpers used by the SQL test files. Lives in a `tests`
-- schema that only exists in the throw-away test database.

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create or replace function tests.assert_equals(actual anyelement, expected anyelement, label text)
returns void
language plpgsql
as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL: % (expected %, got %)', label, expected, actual;
  end if;
  raise notice 'ok - %', label;
end;
$$;

-- Runs `sql` as the current role and passes only if it raises an error.
create or replace function tests.assert_throws(sql text, label text)
returns void
language plpgsql
as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'ok - % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % (statement succeeded but should have been rejected)', label;
end;
$$;

-- Runs `sql` (an UPDATE/DELETE) and asserts how many rows it touched.
create or replace function tests.assert_rows_affected(sql text, expected integer, label text)
returns void
language plpgsql
as $$
declare
  affected integer;
begin
  execute sql;
  get diagnostics affected = row_count;
  perform tests.assert_equals(affected, expected, label);
end;
$$;

-- Switch the session to an authenticated user (or anon when user_id is null),
-- the same way PostgREST does for each request.
create or replace function tests.login_as(user_id uuid)
returns void
language plpgsql
as $$
begin
  if user_id is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end if;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;
