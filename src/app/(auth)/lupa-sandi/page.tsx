import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function ForgotPasswordPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Lupa kata sandi</h1>
      <p className="mt-1 mb-6 text-ink-muted">Masukkan email Anda. Kami akan mengirim tautan untuk membuat kata sandi baru.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </Card>
  );
}
