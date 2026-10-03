"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "@/features/auth/actions";
import type { SignInState } from "@/features/auth/schemas";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: SignInState = { status: "idle" };

const inputClass =
  "block min-h-12 w-full rounded-xl border bg-surface px-4 text-base text-ink placeholder:text-ink-muted/70 " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={cn(inputClass, errors.email ? "border-danger-600" : "border-line")}
          placeholder="nama@sekolah.sch.id"
        />
        {errors.email ? (
          <p id="email-error" className="mt-1.5 text-sm text-danger-600">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={cn(inputClass, errors.password ? "border-danger-600" : "border-line")}
        />
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-sm text-danger-600">
            {errors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
        <LogIn aria-hidden className="size-5" />
        {pending ? "Sedang masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
