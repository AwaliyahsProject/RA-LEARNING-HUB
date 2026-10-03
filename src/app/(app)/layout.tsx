import { redirect } from "next/navigation";
import { connection } from "next/server";
import { UserX } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Brand } from "@/components/layout/brand";
import { UserPanel } from "@/components/layout/user-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { LOGIN_PATH } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { canAccessApp, requireProfile } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Private, per-user UI: always render at request time, never at build.
  await connection();
  if (!isSupabaseConfigured()) redirect(LOGIN_PATH);

  const profile = await requireProfile();

  if (!canAccessApp(profile)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
        <Brand />
        <EmptyState
          icon={UserX}
          title={profile.isActive ? "Akun belum terhubung ke sekolah" : "Akun sedang dinonaktifkan"}
          description="Hubungi kepala sekolah atau admin platform agar akun Anda dihubungkan dan diaktifkan."
        />
        <UserPanel profile={profile} />
      </div>
    );
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
