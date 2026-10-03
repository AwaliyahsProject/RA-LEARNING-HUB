import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--color-brand-50),transparent_60%)] px-4 py-10">
      <div className="mb-8">
        <Brand subtitle="Administrasi • Pembelajaran • Buku Tema • Asesmen" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
