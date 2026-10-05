import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getAcademicYear } from "@/features/academic-years/queries";
import { AcademicYearForm } from "@/features/academic-years/academic-year-form";

export const metadata: Metadata = { title: "Ubah Tahun Ajaran" };

export default async function EditAcademicYearPage({ params }: PageProps<"/sekolah/tahun-ajaran/[id]">) {
  await requireRole(["school_admin"]);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const year = await getAcademicYear(id); // RLS: only years of the admin's own school
  if (!year) notFound();

  return (
    <>
      <Link href="/sekolah/tahun-ajaran" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700">
        <ChevronLeft aria-hidden className="size-4" /> Semua tahun ajaran
      </Link>
      <PageHeader title={`Ubah ${year.name}`} />
      <Card className="max-w-xl">
        <AcademicYearForm id={year.id} defaults={{ name: year.name, startDate: year.startDate, endDate: year.endDate }} />
      </Card>
    </>
  );
}
