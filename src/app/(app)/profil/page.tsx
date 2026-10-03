import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/profile-form";
import { PasswordForm } from "@/features/profile/password-form";

export const metadata: Metadata = { title: "Profil Saya" };

export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader title="Profil Saya" description="Data akun Anda di RA Learning Hub." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Data diri</h2>
          <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-muted">Email</dt>
            <dd className="break-all font-medium">{profile.email}</dd>
            <dt className="text-ink-muted">Peran</dt>
            <dd className="font-medium">{ROLE_LABELS[profile.role]}</dd>
            {profile.schoolName ? (
              <>
                <dt className="text-ink-muted">Sekolah</dt>
                <dd className="font-medium">{profile.schoolName}</dd>
              </>
            ) : null}
          </dl>
          <ProfileForm fullName={profile.fullName} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Ganti kata sandi</h2>
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
