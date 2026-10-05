import { BookOpen, Camera, ClipboardCheck, FileText, Layers, NotebookPen, Shapes, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { listMyClasses } from "@/features/classes/queries";
import { CLASS_TEACHER_ROLE_LABELS } from "@/features/classes/schemas";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickActions, type QuickAction } from "./quick-actions";

const actions: QuickAction[] = [
  { label: "Buat RPPH", href: "/pembelajaran/rpph/baru", icon: FileText, tone: "brand", ready: false },
  { label: "Tambah Asesmen", href: "/anak/asesmen/baru", icon: ClipboardCheck, tone: "accent", ready: false },
  { label: "Tambah Catatan", href: "/anak/anekdot/baru", icon: NotebookPen, tone: "lilac", ready: false },
  { label: "Dokumentasi", href: "/anak/portofolio/unggah", icon: Camera, tone: "sky", ready: false },
  { label: "Buka Buku", href: "/pembelajaran/buku", icon: BookOpen, tone: "brand", ready: false },
  { label: "Cari Aktivitas", href: "/pembelajaran/aktivitas", icon: Shapes, tone: "accent", ready: false },
];

export async function TeacherDashboard({ profileId }: { profileId: string }) {
  const myClasses = await listMyClasses(profileId);

  return (
    <div className="space-y-8">
      <section aria-labelledby="kelas-saya">
        <h2 id="kelas-saya" className="mb-3 text-lg font-bold">
          Kelas Saya
        </h2>
        {myClasses === null ? (
          <ErrorState description="Daftar kelas belum bisa dimuat. Muat ulang halaman ini." />
        ) : myClasses.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Belum ditugaskan ke kelas"
            description="Kepala sekolah akan menugaskan Anda ke kelas pada tahun ajaran aktif."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {myClasses.map((c) => (
              <li key={c.id}>
                <Card className="flex items-center gap-4 p-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-50 text-lg font-bold text-accent-700">
                    {c.level}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-sm text-ink-muted">Tahun ajaran {c.yearName}</p>
                    <Badge tone={c.role === "homeroom" ? "brand" : "neutral"} className="mt-1">
                      {CLASS_TEACHER_ROLE_LABELS[c.role]}
                    </Badge>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hari-ini">
        <h2 id="hari-ini" className="mb-3 text-lg font-bold">
          Pembelajaran Hari Ini
        </h2>
        <EmptyState
          icon={Sun}
          title="Belum ada RPPH untuk hari ini"
          description="Setelah fitur RPPH aktif, rencana pembelajaran hari ini akan tampil di sini lengkap dengan aktivitas dan daftar asesmen."
        />
      </section>

      <section aria-labelledby="aksi-cepat">
        <h2 id="aksi-cepat" className="mb-3 text-lg font-bold">
          Aksi Cepat
        </h2>
        <QuickActions actions={actions} />
      </section>

      <Card className="bg-brand-50/60">
        <p className="text-sm text-ink-muted">
          Aplikasi sedang dibangun bertahap. Fitur yang bertanda <strong>Segera hadir</strong> akan aktif pada tahap
          berikutnya.
        </p>
      </Card>
    </div>
  );
}
