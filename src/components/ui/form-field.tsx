import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "block min-h-12 w-full rounded-xl border bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70 " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60";

export function controlClasses(hasError: boolean, className?: string) {
  return cn(controlBase, hasError ? "border-danger-600" : "border-line", className);
}

/** Label + control + hint/error, wired up with aria attributes. */
export function FormField({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {optional ? <span className="ml-1 font-normal text-ink-muted">(opsional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; error?: string; hint?: string };

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, error, hint, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      id={id}
      name={props.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={controlClasses(Boolean(error), className)}
      {...props}
    />
  );
});

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & { id: string; error?: string; hint?: string };

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { id, error, hint, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      id={id}
      name={props.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={controlClasses(Boolean(error), cn("pr-10", className))}
      {...props}
    >
      {children}
    </select>
  );
});
