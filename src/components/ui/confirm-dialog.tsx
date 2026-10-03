"use client";

import { useRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Button that asks for confirmation in a native <dialog> before submitting
 * the form identified by `formId`. Native dialog gives focus trapping & Esc.
 */
export function ConfirmDialog({
  formId,
  trigger,
  title,
  description,
  confirmLabel,
  variant = "danger",
  triggerVariant = "secondary",
  disabled,
}: {
  formId: string;
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  variant?: ButtonProps["variant"];
  triggerVariant?: ButtonProps["variant"];
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button variant={triggerVariant} disabled={disabled} onClick={() => ref.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={`${formId}-title`}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[var(--radius-card)] bg-surface p-6 text-ink backdrop:bg-ink/30"
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <h2 id={`${formId}-title`} className="text-lg font-bold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-ink-muted">{description}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => ref.current?.close()}>
            Batal
          </Button>
          <Button type="submit" form={formId} variant={variant} onClick={() => ref.current?.close()}>
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
