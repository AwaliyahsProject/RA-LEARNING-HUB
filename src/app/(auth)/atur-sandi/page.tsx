import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { LOGIN_PATH } from "@/config/routes";
import { getCurrentProfile } from "@/lib/auth/session";
import { PasswordForm } from "@/features/profile/password-form";

export const metadata: Metadata = { title: "Atur Kata Sandi" };

export default async function SetPasswordPage({ searchParams }: PageProps<"/atur-sandi">) {
  await connection();
  const profile = await getCurrentProfile();
  if (!profile) redirect(LOGIN_PATH);
  const { undangan } = await searchParams;
  const isInvite = undangan === "1";

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">{isInvite ? "Selamat bergabung! 🎉" : "Atur kata sandi"}</h1>
      <p className="mt-1 mb-6 text-ink-muted">
        {isInvite
          ? `${profile.fullName}, buat kata sandi untuk masuk ke ${profile.schoolName ?? "RA Learning Hub"}.`
          : "Buat kata sandi baru untuk akun Anda."}
      </p>
      <PasswordForm submitLabel={isInvite ? "Simpan & mulai" : "Simpan kata sandi"} />
    </Card>
  );
}
