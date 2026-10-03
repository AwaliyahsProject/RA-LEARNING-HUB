import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { formatLongDate, greetingForHour, hourInTimeZone } from "@/lib/datetime";
import { PageHeader } from "@/components/layout/page-header";
import { TeacherDashboard } from "@/features/dashboard/teacher-dashboard";
import { SchoolAdminDashboard } from "@/features/dashboard/school-admin-dashboard";
import { SuperAdminDashboard } from "@/features/dashboard/super-admin-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const firstName = profile.fullName.split(" ")[0];
  const greeting = greetingForHour(hourInTimeZone(profile.timezone));

  return (
    <>
      <PageHeader title={`${greeting}, ${firstName}`} description={formatLongDate(profile.timezone)} />
      {profile.role === "teacher" ? <TeacherDashboard /> : null}
      {profile.role === "school_admin" ? <SchoolAdminDashboard /> : null}
      {profile.role === "super_admin" ? <SuperAdminDashboard /> : null}
    </>
  );
}
