import Link from "next/link";
import { CalendarRange, CheckCircle2, ChevronRight, Layers, School, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSchoolSetupStatus } from "./queries";

export async function SchoolAdminDashboard({ schoolId }: { schoolId: string }) {
  const status = await getSchoolSetupStatus(schoolId);
  const steps = [
    { label: "Lengkapi profil sekolah", icon: School, href: "/sekolah", done: status.profileComplete },
    { label: "Atur tahun ajaran aktif", icon: CalendarRange, href: "/sekolah/tahun-ajaran", done: status.hasActiveYear },
    { label: "Undang guru", icon: UserRound, href: "/sekolah/guru", done: status.hasTeachers },
    { label: "Buat kelas Kelompok A & B", icon: Layers, href: "/sekolah/kelas", done: status.hasClasses },
    { label: "Tambahkan peserta didik", icon: Users, href: null, done: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Langkah Persiapan Sekolah</h2>
        <p className="text-sm font-semibold text-brand-700">
          {doneCount} dari {steps.length} selesai
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Urutan yang disarankan sebelum guru mulai membuat RPPH.</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas" aria-hidden>
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map(({ label, icon: Icon, href, done }, index) => {
          const inner = (
            <>
              {done ? (
                <CheckCircle2 aria-label="Selesai" className="size-8 shrink-0 text-brand-600" />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {index + 1}
                </span>
              )}
              <Icon aria-hidden className="size-5 text-ink-muted" />
              <span className={cn("flex-1 text-sm font-medium", done && "text-ink-muted line-through")}>{label}</span>
              {href ? <ChevronRight aria-hidden className="size-5 text-brand-600" /> : <Badge tone="neutral">Segera</Badge>}
            </>
          );
          const box = "flex min-h-12 items-center gap-3 rounded-xl border border-line px-3";
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className={cn(box, "hover:border-brand-200 hover:bg-brand-50/40")}>
                  {inner}
                </Link>
              ) : (
                <div className={box}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
