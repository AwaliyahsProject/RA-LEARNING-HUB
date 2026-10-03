import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "error";

const styles: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: "bg-sky-soft text-ink", Icon: Info },
  success: { box: "bg-success-50 text-success-700", Icon: CircleCheck },
  error: { box: "bg-danger-50 text-danger-600", Icon: CircleAlert },
};

/** Inline status message. Errors are announced to screen readers immediately. */
export function Alert({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const { box, Icon } = styles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-sm", box, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
