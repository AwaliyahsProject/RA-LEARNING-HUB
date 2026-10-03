import { BookOpen, Camera, ClipboardCheck, FileText, NotebookPen, Shapes, Sun } from "lucide-react";
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

export function TeacherDashboard() {
  return (
    <div className="space-y-8">
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
