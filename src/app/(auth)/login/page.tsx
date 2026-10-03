import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { HOME_PATH } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Private, per-user UI: always render at request time, never at build.
  await connection();
  const configured = isSupabaseConfigured();
  if (configured && (await getCurrentProfile())) redirect(HOME_PATH);

  const { next } = await searchParams;

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Assalamu&apos;alaikum 👋</h1>
      <p className="mt-1 mb-6 text-ink-muted">Masuk untuk merencanakan dan mendokumentasikan pembelajaran.</p>

      {configured ? (
        <LoginForm next={typeof next === "string" ? next : undefined} />
      ) : (
        <Alert tone="info">
          Aplikasi belum terhubung ke Supabase. Salin <code>.env.example</code> menjadi <code>.env.local</code>, isi
          kredensial project, lalu jalankan ulang server. Lihat README.
        </Alert>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        Belum punya akun? Akun dibuat melalui undangan dari admin sekolah.
      </p>
    </Card>
  );
}
