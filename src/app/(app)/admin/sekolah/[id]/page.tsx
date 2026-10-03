import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { requireRole, toActor } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { getSchool } from "@/features/schools/queries";
import { SCHOOL_TIMEZONES } from "@/features/schools/schemas";
import { MembersPanel } from "@/features/members/members-panel";

export const metadata: Metadata = { title: "Detail Sekolah" };

export default async function SchoolDetailPage({ params, searchParams }: PageProps<"/admin/sekolah/[id]">) {
  const profile = await requireRole(["super_admin"]);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const school = await getSchool(id);
  if (!school) notFound();
  const { baru } = await searchParams;
  const tz = SCHOOL_TIMEZONES.find((t) => t.value === school.timezone)?.label.split(" ")[0];
  const meta = [school.nsm && `NSM ${school.nsm}`, school.npsn && `NPSN ${school.npsn}`, school.regency, school.province, tz]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Link href="/admin/sekolah" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700">
        <ChevronLeft aria-hidden className="size-4" /> Semua sekolah
      </Link>
      <PageHeader title={school.name} description={meta || undefined} />
      {baru === "1" ? (
        <Alert tone="success" className="mb-6">
          Sekolah tersimpan. Langkah berikutnya: undang kepala sekolah.
        </Alert>
      ) : null}
      <MembersPanel schoolId={school.id} actor={toActor(profile)} defaultRole="school_admin" />
    </>
  );
}
