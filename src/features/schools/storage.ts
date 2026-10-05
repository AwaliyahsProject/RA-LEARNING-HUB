import { getPublicEnv } from "@/lib/env";

export const SCHOOL_LOGO_BUCKET = "school-logos";

/** Public URL for a path stored in `schools.logo_url` (bucket `school-logos` is public). */
export function logoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${getPublicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${SCHOOL_LOGO_BUCKET}/${encoded}`;
}
