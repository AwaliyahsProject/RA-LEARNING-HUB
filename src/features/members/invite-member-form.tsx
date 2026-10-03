"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { inviteMember } from "@/features/members/actions";
import type { InviteMemberField } from "@/features/members/schemas";
import { FormField, SelectInput, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { FormState } from "@/lib/forms";
import type { UserRole } from "@/types/database";

const initial: FormState<InviteMemberField> = { status: "idle" };

export function InviteMemberForm({
  schoolId,
  roles,
  defaultRole,
}: {
  schoolId: string;
  roles: readonly UserRole[];
  defaultRole: UserRole;
}) {
  const [state, action] = useActionState(inviteMember, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  // Clear the form after a successful invitation so the next one starts fresh.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="schoolId" value={schoolId} />
      <FormField id="fullName" label="Nama lengkap" error={errors.fullName}>
        <TextInput id="fullName" autoComplete="off" defaultValue={state.values?.fullName} error={errors.fullName} />
      </FormField>
      <FormField id="email" label="Email" error={errors.email}>
        <TextInput
          id="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          defaultValue={state.values?.email}
          error={errors.email}
          placeholder="nama@contoh.id"
        />
      </FormField>
      {roles.length > 1 ? (
        <FormField id="role" label="Peran" error={errors.role}>
          {/* key remounts the select so React's post-action form reset keeps the submitted role */}
          <SelectInput
            key={state.values?.role || defaultRole}
            id="role"
            defaultValue={state.values?.role || defaultRole}
            error={errors.role}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </SelectInput>
        </FormField>
      ) : (
        <input type="hidden" name="role" value={roles[0]} />
      )}
      <SubmitButton className="w-full sm:w-auto" pendingLabel="Mengirim undangan…">
        <Send aria-hidden className="size-4" />
        Kirim undangan
      </SubmitButton>
    </form>
  );
}
