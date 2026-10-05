import { BookHeart } from "lucide-react";

export function Brand({ subtitle, logoUrl }: { subtitle?: string | null; logoUrl?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- school logo from Supabase Storage
        <img src={logoUrl} alt="" className="size-10 shrink-0 rounded-xl border border-line bg-surface object-contain p-0.5" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <BookHeart aria-hidden className="size-5" />
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="font-bold text-ink">RA Learning Hub</p>
        {subtitle ? <p className="truncate text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}
