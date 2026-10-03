import type { Metadata } from "next";
import { requireRole, toActor } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { MembersPanel } from "@/features/members/members-panel";

export const metadata: Metadata = { title: "Guru" };

export default async function TeachersPage() {
  const profile = await requireRole(["school_admin"]);
  // canAccessApp() in the layout guarantees schoolId for non-super-admins.
  const schoolId = profile.schoolId!;

  return (
    <>
      <PageHeader title="Guru & Admin" description={`Kelola akun guru di ${profile.schoolName ?? "sekolah Anda"}.`} />
      <MembersPanel schoolId={schoolId} actor={toActor(profile)} defaultRole="teacher" />
    </>
  );
}
