export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";

/** Routes reachable without a session. Everything else requires login. */
const PUBLIC_PATHS = [LOGIN_PATH, "/lupa-sandi", "/auth"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Only allow same-origin relative redirects after login, to prevent open
 * redirects such as `?next=https://evil.example` or `?next=//evil.example`.
 */
export function safeRedirectPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return HOME_PATH;
  }
  return next;
}
