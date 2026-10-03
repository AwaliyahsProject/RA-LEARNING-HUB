"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "@/features/auth/actions";
import type { SignInState } from "@/features/auth/schemas";
import { Alert } from "@/components/ui/alert";
import { FormField, TextInput } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: SignInState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signIn, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormField id="email" label="Email" error={errors.email}>
        <TextInput
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={errors.email}
          placeholder="nama@sekolah.sch.id"
        />
      </FormField>

      <FormField id="password" label="Kata sandi" error={errors.password}>
        <TextInput id="password" type="password" autoComplete="current-password" required error={errors.password} />
      </FormField>

      <div className="flex justify-end">
        <Link href="/lupa-sandi" className="text-sm font-semibold text-brand-700 hover:underline">
          Lupa kata sandi?
        </Link>
      </div>

      <SubmitButton size="lg" className="w-full" pendingLabel="Sedang masuk…">
        <LogIn aria-hidden className="size-5" />
        Masuk
      </SubmitButton>
    </form>
  );
}
