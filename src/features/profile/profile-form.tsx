"use client";

import { useActionState } from "react";
import { updateOwnProfile } from "@/features/profile/actions";
import { FormField, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action] = useActionState(updateOwnProfile, { status: "idle" } as FormState<"fullName">);
  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <FormField id="fullName" label="Nama lengkap" error={state.fieldErrors?.fullName}>
        <TextInput
          id="fullName"
          autoComplete="name"
          defaultValue={state.values?.fullName ?? fullName}
          error={state.fieldErrors?.fullName}
        />
      </FormField>
      <SubmitButton>Simpan profil</SubmitButton>
    </form>
  );
}
