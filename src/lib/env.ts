import { z } from "zod";

/**
 * Public (browser-safe) configuration. Only NEXT_PUBLIC_* values may live here.
 * Server-only secrets (e.g. SUPABASE_SERVICE_ROLE_KEY) are read exclusively in
 * `src/lib/supabase/admin.ts`, which is guarded by `server-only`.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

// Referenced explicitly so Next.js can inline them into the client bundle.
function readPublicEnv() {
  return publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function isSupabaseConfigured(): boolean {
  return readPublicEnv().success;
}

export function getPublicEnv(): PublicEnv {
  const parsed = readPublicEnv();
  if (!parsed.success) {
    throw new Error(
      "Supabase belum dikonfigurasi. Salin .env.example menjadi .env.local lalu isi " +
        "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return parsed.data;
}
