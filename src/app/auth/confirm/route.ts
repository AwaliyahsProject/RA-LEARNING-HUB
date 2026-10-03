import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { HOME_PATH } from "@/config/routes";

/**
 * Landing point for links in Supabase Auth emails. Templates must link to
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<invite|recovery|email_change>
 * (see supabase/templates and README). The token is verified server-side and
 * the session cookie is set before redirecting.
 */
const paramsSchema = z.object({
  token_hash: z.string().min(10).max(500),
  type: z.enum(["invite", "recovery", "email_change", "email", "signup"]),
});

const NEXT_BY_TYPE: Record<z.infer<typeof paramsSchema>["type"], string> = {
  invite: "/atur-sandi?undangan=1",
  recovery: "/atur-sandi",
  email_change: "/profil",
  email: HOME_PATH,
  signup: HOME_PATH,
};

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const parsed = paramsSchema.safeParse({
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
  });

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (!parsed.success) return redirectTo("/login?pesan=link-tidak-valid");

  const supabase = await createClient();
  // Drop any existing session first so an invite link never acts as the wrong user.
  await supabase.auth.signOut({ scope: "local" });
  const { error } = await supabase.auth.verifyOtp({ type: parsed.data.type, token_hash: parsed.data.token_hash });
  if (error) {
    console.error("[auth] verifyOtp:", error.code, error.message);
    return redirectTo("/login?pesan=link-tidak-valid");
  }
  return redirectTo(NEXT_BY_TYPE[parsed.data.type]);
}
