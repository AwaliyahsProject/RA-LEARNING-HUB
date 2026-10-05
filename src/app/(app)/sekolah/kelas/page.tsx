import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, ChevronRight, Layers } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { listAcademicYears } from "@/features/academic-years/queries";
import { listClasses } from "@/features/classes/queries";
import { CLASS_LEVEL_LABELS } from "@/features/classes/schemas";
import { ClassForm } from "@/features/classes/class-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kelas" };

export default async function ClassesPage({ searchParams }: PageProps<"/sekolah/kelas">) {
  const profile = await requireRole(["school_admin"]);
  const { tahun, pesan } = await searchParams;
  const years = await listAcademicYears(profile.schoolId!);

  if (years === null) return <ErrorState />;
  if (years.length === 0) {
    return (
      <>
        <PageHeader title="Kelas" />
        <EmptyState
          icon={CalendarRange}
          title="Buat tahun ajaran terlebih dahulu"
          description="Kelas selalu berada di dalam satu tahun ajaran."
          action={
            <Link href="/sekolah/tahun-ajaran" className={buttonClasses()}>
              Atur tahun ajaran
            </Link>
          }
        />
      </>
    );
  }

  const selected = years.find((y) => y.id === tahun) ?? years.find((y) => y.isActive) ?? years[0];
  const classes = await listClasses(selected.id);

  return (
    <>
      <PageHeader title="Kelas" description="Kelompok A dan B per tahun ajaran, beserta wali kelas dan guru pendamping." />
      {pesan === "kelas-dihapus" ? (
        <Alert tone="success" className="mb-6">
          Kelas dihapus.
        </Alert>
      ) : null}

      <nav aria-label="Pilih tahun ajaran" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {years.map((y) => (
          <Link
            key={y.id}
            href={`/sekolah/kelas?tahun=${y.id}`}
            aria-current={y.id === selected.id ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
              y.id === selected.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-muted",
            )}
          >
            {y.name}
            {y.isActive ? <span className="text-xs font-medium">(aktif)</span> : null}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          {classes === null ? (
            <ErrorState />
          ) : classes.length === 0 ? (
            <EmptyState icon={Layers} title={`Belum ada kelas di ${selected.name}`} description="Tambahkan kelas melalui formulir." />
          ) : (
            (["A", "B"] as const).map((level) => {
              const list = classes.filter((c) => c.level === level);
              if (list.length === 0) return null;
              return (
                <section key={level} aria-labelledby={`kelompok-${level}`}>
                  <h2 id={`kelompok-${level}`} className="mb-3 text-lg font-bold">
                    {CLASS_LEVEL_LABELS[level]}
                  </h2>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {list.map((c) => {
                      const homeroom = c.teachers.find((t) => t.role === "homeroom");
                      const assistants = c.teachers.filter((t) => t.role === "assistant").length;
                      return (
                        <li key={c.id}>
                          <Link href={`/sekolah/kelas/${c.id}`} className="block rounded-[var(--radius-card)]">
                            <Card className="flex items-center gap-3 p-4 hover:border-brand-200">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold">{c.name}</p>
                                <p className="truncate text-sm text-ink-muted">
                                  {homeroom ? `Wali: ${homeroom.name}` : "Belum ada wali kelas"}
                                </p>
                                {assistants > 0 ? (
                                  <Badge tone="neutral" className="mt-1">
                                    +{assistants} pendamping
                                  </Badge>
                                ) : null}
                              </div>
                              <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-muted" />
                            </Card>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        <Card className="lg:sticky lg:top-6">
          <h2 className="mb-1 text-lg font-bold">Tambah kelas</h2>
          <p className="mb-4 text-sm text-ink-muted">Di tahun ajaran {selected.name}.</p>
          <ClassForm key={selected.id} academicYearId={selected.id} />
        </Card>
      </div>
    </>
  );
}
