"use client";

import { useActionState } from "react";
import { createSchool } from "@/features/schools/actions";
import { SCHOOL_TIMEZONES, type CreateSchoolField } from "@/features/schools/schemas";
import { FormField, SelectInput, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";

const initial: FormState<CreateSchoolField> = { status: "idle" };

export function CreateSchoolForm() {
  const [state, action] = useActionState(createSchool, initial);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      <FormField id="name" label="Nama sekolah" error={e.name}>
        <TextInput id="name" defaultValue={v.name} error={e.name} placeholder="RA Al-Hikmah" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="nsm" label="NSM" optional error={e.nsm} hint="12 angka">
          <TextInput id="nsm" inputMode="numeric" maxLength={12} defaultValue={v.nsm} error={e.nsm} hint="12 angka" />
        </FormField>
        <FormField id="npsn" label="NPSN" optional error={e.npsn} hint="8 angka">
          <TextInput id="npsn" inputMode="numeric" maxLength={8} defaultValue={v.npsn} error={e.npsn} hint="8 angka" />
        </FormField>
        <FormField id="regency" label="Kabupaten/Kota" optional error={e.regency}>
          <TextInput id="regency" defaultValue={v.regency} error={e.regency} />
        </FormField>
        <FormField id="province" label="Provinsi" optional error={e.province}>
          <TextInput id="province" defaultValue={v.province} error={e.province} />
        </FormField>
      </div>
      <FormField id="timezone" label="Zona waktu" error={e.timezone}>
        <SelectInput key={v.timezone || "default"} id="timezone" defaultValue={v.timezone || "Asia/Jakarta"} error={e.timezone}>
          {SCHOOL_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <SubmitButton size="lg" className="w-full sm:w-auto">
        Simpan sekolah
      </SubmitButton>
    </form>
  );
}
