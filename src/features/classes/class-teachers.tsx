"use client";

import { useActionState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { assignTeacher, removeTeacher } from "@/features/classes/actions";
import { CLASS_TEACHER_ROLE_LABELS } from "@/features/classes/schemas";
import { Badge } from "@/components/ui/badge";
import { FormField, SelectInput } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState, type FormState } from "@/lib/forms";
import type { ClassTeacherRole } from "@/types/database";

type Assigned = { assignmentId: string; teacherId: string; name: string; role: ClassTeacherRole };
type Candidate = { id: string; name: string };

function RemoveTeacher({
  classId,
  assignment,
  action,
}: {
  classId: string;
  assignment: Assigned;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="assignmentId" value={assignment.assignmentId} />
      <SubmitButton variant="ghost" pendingLabel="Melepas…" aria-label={`Lepas ${assignment.name} dari kelas`}>
        <UserMinus aria-hidden className="size-4" />
        Lepas
      </SubmitButton>
    </form>
  );
}

export function ClassTeachers({
  classId,
  assigned,
  candidates,
}: {
  classId: string;
  assigned: Assigned[];
  candidates: Candidate[];
}) {
  const [state, action] = useActionState(assignTeacher, { status: "idle" } as FormState<"teacherId" | "role">);
  // Owned here (not per row) so the message survives the removed row unmounting.
  const [removeState, removeAction] = useActionState(removeTeacher, idleState);
  const assignedIds = new Set(assigned.map((a) => a.teacherId));
  const available = candidates.filter((c) => !assignedIds.has(c.id));
  const hasHomeroom = assigned.some((a) => a.role === "homeroom");
  const defaultRole: ClassTeacherRole = hasHomeroom ? "assistant" : "homeroom";

  return (
    <div className="space-y-5">
      <FormMessage state={removeState} />
      {assigned.length === 0 ? (
        <p className="rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">Belum ada guru di kelas ini.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {assigned.map((a) => (
            <li key={a.assignmentId} className="flex items-center justify-between gap-3 px-4 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.name}</p>
                <Badge tone={a.role === "homeroom" ? "brand" : "neutral"}>{CLASS_TEACHER_ROLE_LABELS[a.role]}</Badge>
              </div>
              <RemoveTeacher classId={classId} assignment={a} action={removeAction} />
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <form action={action} noValidate className="space-y-3">
          <FormMessage state={state} />
          <input type="hidden" name="classId" value={classId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="teacherId" label="Guru" error={state.fieldErrors?.teacherId}>
              <SelectInput key={`t-${assigned.length}`} id="teacherId" defaultValue="" error={state.fieldErrors?.teacherId}>
                <option value="" disabled>
                  Pilih guru…
                </option>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField id="role" label="Peran di kelas" error={state.fieldErrors?.role}>
              <SelectInput key={`r-${defaultRole}`} id="role" defaultValue={defaultRole} error={state.fieldErrors?.role}>
                {(["homeroom", "assistant"] as const).map((r) => (
                  <option key={r} value={r} disabled={r === "homeroom" && hasHomeroom}>
                    {CLASS_TEACHER_ROLE_LABELS[r]}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <SubmitButton variant="secondary" pendingLabel="Menugaskan…">
            <UserPlus aria-hidden className="size-4" />
            Tugaskan guru
          </SubmitButton>
        </form>
      ) : (
        <p className="text-sm text-ink-muted">Semua guru aktif sudah ditugaskan di kelas ini.</p>
      )}
    </div>
  );
}
