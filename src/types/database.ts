/**
 * Database types. `supabase.ts` is GENERATED from the local Supabase schema —
 * never edit it by hand; run `npm run db:types` after adding a migration
 * (requires `npx supabase start`). App-level narrowings live here.
 */
import type { Enums } from "./supabase";

export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./supabase";

export type UserRole = Enums<"user_role">;
export type ClassLevel = Enums<"class_level">;
export type ClassTeacherRole = Enums<"class_teacher_role">;

/** Values allowed by the `schools.timezone` check constraint (WIB/WITA/WIT). */
export const SCHOOL_TIMEZONE_VALUES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;
export type SchoolTimezone = (typeof SCHOOL_TIMEZONE_VALUES)[number];

export function isSchoolTimezone(value: unknown): value is SchoolTimezone {
  return typeof value === "string" && (SCHOOL_TIMEZONE_VALUES as readonly string[]).includes(value);
}
