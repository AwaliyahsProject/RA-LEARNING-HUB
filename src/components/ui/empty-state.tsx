import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-brand-200 bg-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon aria-hidden className="size-7" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
