import { BookHeart } from "lucide-react";

export function Brand({ subtitle }: { subtitle?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
        <BookHeart aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="font-bold text-ink">RA Learning Hub</p>
        {subtitle ? <p className="truncate text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}
