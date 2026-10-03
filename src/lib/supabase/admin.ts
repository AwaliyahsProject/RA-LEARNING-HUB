import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. BYPASSES RLS — use only in server code for operations
 * that RLS intentionally forbids for end users (e.g. sending invitations with
 * app_metadata). Always authorize the caller with `requireRole()` first.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di environment server.");
  }
  return createClient<Database>(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
