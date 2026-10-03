import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: "brand" | "accent" | "sky" | "lilac";
  ready: boolean;
};

const toneClass: Record<QuickAction["tone"], string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  sky: "bg-sky-soft text-brand-800",
  lilac: "bg-lilac-soft text-brand-800",
};

/** Large, thumb-friendly shortcuts. Unshipped features are shown but not clickable. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map(({ label, href, icon: Icon, tone, ready }) => {
        const inner = (
          <>
            <span className={cn("grid size-11 place-items-center rounded-xl", toneClass[tone])}>
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="text-sm font-semibold leading-snug">{label}</span>
            {!ready ? <span className="text-[11px] font-medium text-ink-muted">Segera hadir</span> : null}
          </>
        );
        const box = "flex min-h-28 flex-col items-start gap-2 rounded-2xl border border-line bg-surface p-4";
        return (
          <li key={href}>
            {ready ? (
              <Link href={href} className={cn(box, "hover:border-brand-200 hover:bg-brand-50/40")}>
                {inner}
              </Link>
            ) : (
              <div aria-disabled="true" className={cn(box, "opacity-70")}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
