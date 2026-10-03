import { Building2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function getPlatformCounts() {
  const supabase = await createClient();
  // RLS: only super admins can count every tenant; head:true avoids loading rows.
  const [schools, profiles] = await Promise.all([
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    schools: schools.error ? null : schools.count,
    users: profiles.error ? null : profiles.count,
  };
}

export async function SuperAdminDashboard() {
  const counts = await getPlatformCounts();
  const stats = [
    { label: "Sekolah terdaftar", value: counts.schools, icon: Building2 },
    { label: "Pengguna", value: counts.users, icon: Users },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon aria-hidden className="size-6" />
          </span>
          <div>
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="text-2xl font-bold">{value ?? "—"}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
