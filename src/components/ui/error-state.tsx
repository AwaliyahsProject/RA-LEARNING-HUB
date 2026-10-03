import { CloudAlert } from "lucide-react";
import type { ReactNode } from "react";

/** Friendly error panel. Never pass raw database/server messages as `description`. */
export function ErrorState({
  title = "Terjadi kendala",
  description = "Maaf, halaman ini belum bisa ditampilkan. Periksa koneksi internet lalu coba lagi.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[var(--radius-card)] bg-danger-50 px-6 py-10 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-surface text-danger-600">
        <CloudAlert aria-hidden className="size-7" />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
