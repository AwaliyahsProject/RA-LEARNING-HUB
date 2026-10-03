import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { formatLongDate, greetingForHour, hourInTimeZone } from "@/lib/datetime";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { TeacherDashboard } from "@/features/dashboard/teacher-dashboard";
import { SchoolAdminDashboard } from "@/features/dashboard/school-admin-dashboard";
import { SuperAdminDashboard } from "@/features/dashboard/super-admin-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const profile = await requireProfile();
  const firstName = profile.fullName.split(" ")[0];
  const greeting = greetingForHour(hourInTimeZone(profile.timezone));
  const { pesan } = await searchParams;

  return (
    <>
      <PageHeader title={`${greeting}, ${firstName}`} description={formatLongDate(profile.timezone)} />
      {pesan === "sandi-tersimpan" ? (
        <Alert tone="success" className="mb-6">
          Kata sandi tersimpan. Gunakan kata sandi ini saat masuk berikutnya.
        </Alert>
      ) : null}
      {profile.role === "teacher" ? <TeacherDashboard /> : null}
      {profile.role === "school_admin" ? <SchoolAdminDashboard /> : null}
      {profile.role === "super_admin" ? <SuperAdminDashboard /> : null}
    </>
  );
}
