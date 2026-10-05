import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/datetime";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { listAcademicYears } from "@/features/academic-years/queries";
import { suggestAcademicYear } from "@/features/academic-years/schemas";
import { AcademicYearForm } from "@/features/academic-years/academic-year-form";
import { AcademicYearActions } from "@/features/academic-years/academic-year-actions";

export const metadata: Metadata = { title: "Tahun Ajaran" };

export default async function AcademicYearsPage({ searchParams }: PageProps<"/sekolah/tahun-ajaran">) {
  const profile = await requireRole(["school_admin"]);
  const years = await listAcademicYears(profile.schoolId!);
  const { pesan } = await searchParams;

  return (
    <>
      <PageHeader title="Tahun Ajaran" description="Kelas dan data pembelajaran dikelompokkan per tahun ajaran." />
      {pesan === "tersimpan" || pesan === "dihapus" ? (
        <Alert tone="success" className="mb-6">
          {pesan === "dihapus" ? "Tahun ajaran dihapus." : "Perubahan tahun ajaran tersimpan."}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section aria-label="Daftar tahun ajaran" className="min-w-0">
          {years === null ? (
            <ErrorState />
          ) : years.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Belum ada tahun ajaran"
              description="Tambahkan tahun ajaran pertama. Tahun ajaran pertama otomatis menjadi tahun ajaran aktif."
            />
          ) : (
            <ul className="space-y-3">
              {years.map((y) => (
                <li key={y.id}>
                  <Card className={y.isActive ? "border-brand-200 p-4" : "p-4"}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-lg font-bold">
                          {y.name}
                          {y.isActive ? <Badge>Aktif</Badge> : null}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {formatDate(y.startDate)} – {formatDate(y.endDate)}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">{y.classCount} kelas</p>
                      </div>
                      <AcademicYearActions id={y.id} name={y.name} isActive={y.isActive} classCount={y.classCount} />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card className="lg:sticky lg:top-6">
          <h2 className="mb-4 text-lg font-bold">Tambah tahun ajaran</h2>
          <AcademicYearForm defaults={suggestAcademicYear()} showActivate={(years?.length ?? 0) > 0} />
        </Card>
      </div>
    </>
  );
}
