#!/usr/bin/env bash
# Applies all migrations to a throw-away PostgreSQL database and runs the SQL
# test suite (RLS / tenant isolation). Requires a plain PostgreSQL 15+ server.
#
#   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:test
#
# The target server must NOT be a Supabase project: the harness creates stub
# `auth` objects that already exist on Supabase.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_URL="${TEST_DATABASE_URL:-postgres://postgres:postgres@localhost:5432/postgres}"
DB_NAME="ra_test_$(date +%s)_$$"
TEST_URL="${ADMIN_URL%/*}/${DB_NAME}"
PSQL=(psql -X -q -t -v ON_ERROR_STOP=1)

cleanup() {
  psql -X -q "$ADMIN_URL" -c "drop database if exists \"${DB_NAME}\" with (force)" >/dev/null 2>&1 || true
}
trap cleanup EXIT

psql -X -q "$ADMIN_URL" -c "create database \"${DB_NAME}\"" >/dev/null

run_dir() {
  local dir="$1"
  shopt -s nullglob
  for file in "$dir"/*.sql; do
    echo "→ ${file#"$ROOT"/}"
    "${PSQL[@]}" "$TEST_URL" -f "$file"
  done
}

run_dir "$ROOT/supabase/rls-tests/_harness"
run_dir "$ROOT/supabase/migrations"
run_dir "$ROOT/supabase/rls-tests"

echo "✔ Database tests passed"
