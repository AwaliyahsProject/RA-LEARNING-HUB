"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/features/profile/actions";
import { FormField, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";

const initial: FormState<"email"> = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <FormField id="email" label="Email akun Anda" error={state.fieldErrors?.email}>
        <TextInput
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
        />
      </FormField>
      <SubmitButton size="lg" className="w-full" pendingLabel="Mengirim…">
        Kirim tautan
      </SubmitButton>
    </form>
  );
}
