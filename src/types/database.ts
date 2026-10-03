/**
 * Database types in the same shape as `supabase gen types typescript`.
 * Hand-maintained until a Supabase project is linked; then regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 * Keep in sync with supabase/migrations.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SchoolTimezone = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";

type AuditColumns = {
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type SchoolRow = AuditColumns & {
  id: string;
  name: string;
  npsn: string | null;
  nsm: string | null;
  address: string | null;
  village: string | null;
  district: string | null;
  regency: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  timezone: SchoolTimezone;
  is_active: boolean;
};

type ProfileRow = AuditColumns & {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: Database["public"]["Enums"]["user_role"];
  school_id: string | null;
  is_active: boolean;
  invited_at: string | null;
  invited_by: string | null;
  joined_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: SchoolRow;
        Insert: Partial<SchoolRow> & { name: string };
        Update: Partial<SchoolRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: "super_admin" | "school_admin" | "teacher";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];
