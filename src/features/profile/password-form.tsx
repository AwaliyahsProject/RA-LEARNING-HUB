"use client";

import { useActionState } from "react";
import { updatePassword } from "@/features/profile/actions";
import { FormField, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";

const initial: FormState<"password" | "confirm"> = { status: "idle" };

export function PasswordForm({ submitLabel = "Simpan kata sandi" }: { submitLabel?: string }) {
  const [state, action] = useActionState(updatePassword, initial);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <FormField id="password" label="Kata sandi baru" error={errors.password} hint="Minimal 8 karakter, berisi huruf dan angka.">
        <TextInput id="password" type="password" autoComplete="new-password" error={errors.password} hint="Minimal 8 karakter, berisi huruf dan angka." />
      </FormField>
      <FormField id="confirm" label="Ulangi kata sandi baru" error={errors.confirm}>
        <TextInput id="confirm" type="password" autoComplete="new-password" error={errors.confirm} />
      </FormField>
      <SubmitButton size="lg" className="w-full">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
