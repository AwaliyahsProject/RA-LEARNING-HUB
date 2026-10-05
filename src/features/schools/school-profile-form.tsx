"use client";

import { useActionState } from "react";
import { updateSchoolProfile } from "@/features/schools/actions";
import { SCHOOL_TIMEZONES, type SchoolProfileField } from "@/features/schools/schemas";
import { FormField, SelectInput, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";

type Values = Partial<Record<SchoolProfileField, string>>;
const initial: FormState<SchoolProfileField> = { status: "idle" };

export function SchoolProfileForm({ defaults }: { defaults: Values }) {
  const [state, action] = useActionState(updateSchoolProfile, initial);
  const e = state.fieldErrors ?? {};
  const v: Values = { ...defaults, ...state.values };

  const text = (id: SchoolProfileField, label: string, props: { optional?: boolean; hint?: string; inputMode?: "numeric" | "tel" | "email"; maxLength?: number; type?: string } = {}) => (
    <FormField id={id} label={label} error={e[id]} hint={props.hint} optional={props.optional}>
      <TextInput
        id={id}
        defaultValue={v[id] ?? ""}
        error={e[id]}
        hint={props.hint}
        inputMode={props.inputMode}
        maxLength={props.maxLength}
        type={props.type}
      />
    </FormField>
  );

  return (
    <form action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      {text("name", "Nama sekolah")}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("nsm", "NSM", { optional: true, hint: "12 angka", inputMode: "numeric", maxLength: 12 })}
        {text("npsn", "NPSN", { optional: true, hint: "8 angka", inputMode: "numeric", maxLength: 8 })}
      </div>
      {text("address", "Alamat", { optional: true })}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("village", "Desa/Kelurahan", { optional: true })}
        {text("district", "Kecamatan", { optional: true })}
        {text("regency", "Kabupaten/Kota", { optional: true })}
        {text("province", "Provinsi", { optional: true })}
        {text("phone", "Telepon", { optional: true, inputMode: "tel", type: "tel" })}
        {text("email", "Email sekolah", { optional: true, inputMode: "email", type: "email" })}
      </div>
      <FormField id="timezone" label="Zona waktu" error={e.timezone}>
        <SelectInput key={v.timezone} id="timezone" defaultValue={v.timezone ?? "Asia/Jakarta"} error={e.timezone}>
          {SCHOOL_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <SubmitButton size="lg" className="w-full sm:w-auto">
        Simpan profil sekolah
      </SubmitButton>
    </form>
  );
}
