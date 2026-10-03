import { LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { CurrentProfile } from "@/lib/auth/session";

export function UserPanel({ profile }: { profile: CurrentProfile }) {
  const initial = profile.fullName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="rounded-2xl bg-canvas p-3">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-100 font-bold text-accent-700">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile.fullName}</p>
          <p className="truncate text-xs text-ink-muted">{ROLE_LABELS[profile.role]}</p>
        </div>
      </div>
      <form action={signOut} className="mt-3">
        <button
          type="submit"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-ink hover:bg-danger-50 hover:text-danger-600"
        >
          <LogOut aria-hidden className="size-4" />
          Keluar
        </button>
      </form>
    </div>
  );
}
