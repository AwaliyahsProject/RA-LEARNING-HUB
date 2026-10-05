"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAcademicYear, updateAcademicYear } from "@/features/academic-years/actions";
import type { AcademicYearField } from "@/features/academic-years/schemas";
import { FormField, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";

type Defaults = { name: string; startDate: string; endDate: string };
const initial: FormState<AcademicYearField> = { status: "idle" };

/** Create (no `id`) or edit (with `id`) an academic year. */
export function AcademicYearForm({ id, defaults, showActivate }: { id?: string; defaults: Defaults; showActivate?: boolean }) {
  const [state, action] = useActionState(id ? updateAcademicYear : createAcademicYear, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.fieldErrors ?? {};
  const v = { ...defaults, ...state.values };

  useEffect(() => {
    if (state.status === "success" && !id) formRef.current?.reset();
  }, [state, id]);

  return (
    <form ref={formRef} action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormField id="name" label="Nama tahun ajaran" error={e.name} hint="Contoh: 2026/2027">
        <TextInput id="name" defaultValue={v.name} error={e.name} hint="Contoh: 2026/2027" inputMode="numeric" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="startDate" label="Tanggal mulai" error={e.startDate}>
          <TextInput id="startDate" type="date" defaultValue={v.startDate} error={e.startDate} />
        </FormField>
        <FormField id="endDate" label="Tanggal selesai" error={e.endDate}>
          <TextInput id="endDate" type="date" defaultValue={v.endDate} error={e.endDate} />
        </FormField>
      </div>
      {showActivate ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="makeActive" className="size-5 accent-brand-600" />
          Jadikan tahun ajaran aktif
        </label>
      ) : null}
      <SubmitButton className="w-full sm:w-auto">{id ? "Simpan perubahan" : "Tambah tahun ajaran"}</SubmitButton>
    </form>
  );
}
