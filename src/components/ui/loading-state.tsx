import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Memuat…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-3 py-16 text-ink-muted", className)}>
      <LoaderCircle aria-hidden className="size-6 animate-spin text-brand-500" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
