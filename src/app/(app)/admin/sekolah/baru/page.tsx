import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CreateSchoolForm } from "@/features/schools/create-school-form";

export const metadata: Metadata = { title: "Tambah Sekolah" };

export default async function NewSchoolPage() {
  await requireRole(["super_admin"]);
  return (
    <>
      <PageHeader title="Tambah Sekolah" description="Setelah disimpan, Anda bisa langsung mengundang kepala sekolah." />
      <Card className="max-w-2xl">
        <CreateSchoolForm />
      </Card>
    </>
  );
}
