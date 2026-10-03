import { CalendarRange, Layers, School, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const setupSteps = [
  { label: "Lengkapi profil sekolah", icon: School },
  { label: "Atur tahun ajaran aktif", icon: CalendarRange },
  { label: "Undang guru", icon: UserRound },
  { label: "Buat kelas Kelompok A & B", icon: Layers },
  { label: "Tambahkan peserta didik", icon: Users },
];

export function SchoolAdminDashboard() {
  return (
    <Card>
      <h2 className="text-lg font-bold">Langkah Persiapan Sekolah</h2>
      <p className="mt-1 text-sm text-ink-muted">Urutan yang disarankan sebelum guru mulai membuat RPPH.</p>
      <ol className="mt-5 space-y-3">
        {setupSteps.map(({ label, icon: Icon }, index) => (
          <li key={label} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
              {index + 1}
            </span>
            <Icon aria-hidden className="size-5 text-ink-muted" />
            <span className="flex-1 text-sm font-medium">{label}</span>
            <Badge tone="neutral">Segera</Badge>
          </li>
        ))}
      </ol>
    </Card>
  );
}
