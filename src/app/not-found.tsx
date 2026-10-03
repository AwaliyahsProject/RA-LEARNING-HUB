import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { HOME_PATH } from "@/config/routes";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <EmptyState
        icon={Compass}
        title="Halaman tidak ditemukan"
        description="Halaman yang Anda cari tidak ada atau sudah dipindahkan."
        action={
          <Link href={HOME_PATH} className={buttonClasses()}>
            Kembali ke Dashboard
          </Link>
        }
        className="w-full"
      />
    </div>
  );
}
