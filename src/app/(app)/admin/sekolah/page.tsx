import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { controlClasses } from "@/components/ui/form-field";
import { listSchools, SCHOOL_PAGE_SIZE } from "@/features/schools/queries";

export const metadata: Metadata = { title: "Sekolah" };

export default async function SchoolsPage({ searchParams }: PageProps<"/admin/sekolah">) {
  await requireRole(["super_admin"]);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const page = Math.max(1, Number.parseInt(typeof params.hal === "string" ? params.hal : "1", 10) || 1);
  const result = await listSchools({ query: q, page });
  const totalPages = result ? Math.max(1, Math.ceil(result.total / SCHOOL_PAGE_SIZE)) : 1;
  const pageHref = (p: number) => `/admin/sekolah?${new URLSearchParams({ ...(q ? { q } : {}), hal: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Sekolah"
        description="Semua RA yang terdaftar di platform."
        actions={
          <Link href="/admin/sekolah/baru" className={buttonClasses()}>
            <Plus aria-hidden className="size-4" />
            Tambah Sekolah
          </Link>
        }
      />

      <form role="search" className="mb-5 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Cari sekolah
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Cari nama sekolah…" className={controlClasses(false)} />
        <button type="submit" className={buttonClasses({ variant: "secondary" })} aria-label="Cari">
          <Search aria-hidden className="size-4" />
        </button>
      </form>

      {result === null ? (
        <ErrorState />
      ) : result.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={q ? "Sekolah tidak ditemukan" : "Belum ada sekolah"}
          description={q ? `Tidak ada sekolah dengan nama "${q}".` : "Tambahkan sekolah pertama, lalu undang kepala sekolahnya."}
        />
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {result.items.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sekolah/${s.id}`} className="block rounded-[var(--radius-card)] focus-visible:outline-2">
                  <Card className="p-4 hover:border-brand-200">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-ink-muted">
                      {[s.regency, s.province].filter(Boolean).join(", ") || "Lokasi belum diisi"}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      <Badge tone="neutral">{s.memberCount} pengguna</Badge>
                      {!s.isActive ? <Badge tone="accent">Nonaktif</Badge> : null}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <nav aria-label="Halaman" className="mt-6 flex items-center justify-between gap-2 text-sm">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={buttonClasses({ variant: "secondary" })}>
                  <ChevronLeft aria-hidden className="size-4" /> Sebelumnya
                </Link>
              ) : <span />}
              <span className="text-ink-muted">
                Halaman {page} dari {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className={buttonClasses({ variant: "secondary" })}>
                  Berikutnya <ChevronRight aria-hidden className="size-4" />
                </Link>
              ) : <span />}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
