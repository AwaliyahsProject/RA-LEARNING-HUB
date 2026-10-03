import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "accent" | "neutral";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  neutral: "bg-canvas text-ink-muted border border-line",
};

export function Badge({ tone = "brand", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
