"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClass, updateClass } from "@/features/classes/actions";
import { CLASS_LEVEL_LABELS, type ClassField } from "@/features/classes/schemas";
import { FormField, TextInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import type { ClassLevel } from "@/types/database";

const initial: FormState<ClassField> = { status: "idle" };

/** Create a class in `academicYearId`, or edit `classId`. */
export function ClassForm({
  academicYearId,
  classId,
  defaults = { name: "", level: "A" },
}: {
  academicYearId?: string;
  classId?: string;
  defaults?: { name: string; level: ClassLevel };
}) {
  const [state, action] = useActionState(classId ? updateClass : createClass, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.fieldErrors ?? {};
  const level = (state.values?.level as ClassLevel | undefined) ?? defaults.level;

  useEffect(() => {
    if (state.status === "success" && !classId) formRef.current?.reset();
  }, [state, classId]);

  return (
    <form ref={formRef} action={action} noValidate className="space-y-4">
      <FormMessage state={state} />
      {classId ? <input type="hidden" name="classId" value={classId} /> : null}
      {academicYearId ? <input type="hidden" name="academicYearId" value={academicYearId} /> : null}
      <FormField id="name" label="Nama kelas" error={e.name} hint="Contoh: Kelompok A1, Kelas Melati">
        <TextInput
          id="name"
          defaultValue={state.values?.name ?? defaults.name}
          error={e.name}
          hint="Contoh: Kelompok A1, Kelas Melati"
        />
      </FormField>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Kelompok usia</legend>
        <div className="grid grid-cols-2 gap-2" key={level}>
          {(["A", "B"] as const).map((l) => (
            <label
              key={l}
              className={cn(
                "flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border border-line bg-surface px-4 py-2",
                "has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50",
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                <input type="radio" name="level" value={l} defaultChecked={level === l} className="size-4 accent-brand-600" />
                Kelompok {l}
              </span>
              <span className="text-xs text-ink-muted">{CLASS_LEVEL_LABELS[l].replace(`Kelompok ${l} `, "")}</span>
            </label>
          ))}
        </div>
        {e.level ? <p className="mt-1.5 text-sm text-danger-600">{e.level}</p> : null}
      </fieldset>
      <SubmitButton className="w-full sm:w-auto">{classId ? "Simpan perubahan" : "Tambah kelas"}</SubmitButton>
    </form>
  );
}
