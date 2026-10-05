import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { getSchoolProfile } from "@/features/schools/queries";
import { logoPublicUrl } from "@/features/schools/storage";
import { SchoolProfileForm } from "@/features/schools/school-profile-form";
import { LogoUploader } from "@/features/schools/logo-uploader";

export const metadata: Metadata = { title: "Profil Sekolah" };

export default async function SchoolProfilePage() {
  const profile = await requireRole(["school_admin"]);
  const school = await getSchoolProfile(profile.schoolId!);
  if (!school) return <ErrorState />;

  const defaults = Object.fromEntries(
    Object.entries(school).map(([k, val]) => [k, val ?? ""]),
  ) as Record<string, string>;

  return (
    <>
      <PageHeader title="Profil Sekolah" description="Identitas sekolah dipakai di dokumen RPPH, laporan, dan rapor." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <Card>
          <SchoolProfileForm defaults={defaults} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Logo sekolah</h2>
          <LogoUploader currentUrl={logoPublicUrl(school.logo_url)} />
        </Card>
      </div>
    </>
  );
}
