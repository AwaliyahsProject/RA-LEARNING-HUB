import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getClass, listAssignableTeachers } from "@/features/classes/queries";
import { CLASS_LEVEL_LABELS } from "@/features/classes/schemas";
import { ClassForm } from "@/features/classes/class-form";
import { ClassTeachers } from "@/features/classes/class-teachers";
import { DeleteClass } from "@/features/classes/delete-class";

export const metadata: Metadata = { title: "Detail Kelas" };

export default async function ClassDetailPage({ params }: PageProps<"/sekolah/kelas/[id]">) {
  const profile = await requireRole(["school_admin"]);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [klass, candidates] = await Promise.all([getClass(id), listAssignableTeachers(profile.schoolId!)]);
  if (!klass) notFound();

  return (
    <>
      <Link
        href={`/sekolah/kelas?tahun=${klass.academicYear?.id ?? ""}`}
        className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700"
      >
        <ChevronLeft aria-hidden className="size-4" /> Semua kelas
      </Link>
      <PageHeader
        title={klass.name}
        description={`${CLASS_LEVEL_LABELS[klass.level]} · Tahun ajaran ${klass.academicYear?.name ?? "-"}`}
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Guru kelas</h2>
          <ClassTeachers classId={klass.id} assigned={klass.teachers} candidates={candidates} />
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Data kelas</h2>
            <ClassForm classId={klass.id} defaults={{ name: klass.name, level: klass.level }} />
          </Card>
          <DeleteClass classId={klass.id} name={klass.name} />
        </div>
      </div>
    </>
  );
}
