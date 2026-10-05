"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { activateAcademicYear, deleteAcademicYear } from "@/features/academic-years/actions";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms";

export function AcademicYearActions({
  id,
  name,
  isActive,
  classCount,
}: {
  id: string;
  name: string;
  isActive: boolean;
  classCount: number;
}) {
  const [activateState, activate] = useActionState(activateAcademicYear, idleState);
  const [deleteState, remove] = useActionState(deleteAcademicYear, idleState);
  const deleteFormId = `delete-year-${id}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <form action={activate}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="secondary" pendingLabel="Mengaktifkan…">
              <CheckCircle2 aria-hidden className="size-4" />
              Jadikan aktif
            </SubmitButton>
          </form>
        ) : null}
        <Link href={`/sekolah/tahun-ajaran/${id}`} className={buttonClasses({ variant: "ghost" })}>
          <Pencil aria-hidden className="size-4" />
          Ubah
        </Link>
        <form id={deleteFormId} action={remove}>
          <input type="hidden" name="id" value={id} />
        </form>
        {classCount === 0 ? (
          <ConfirmDialog
            formId={deleteFormId}
            triggerVariant="ghost"
            title={`Hapus tahun ajaran ${name}?`}
            description="Tahun ajaran yang dihapus tidak bisa dikembalikan."
            confirmLabel="Ya, hapus"
            trigger={
              <>
                <Trash2 aria-hidden className="size-4" />
                Hapus
              </>
            }
          />
        ) : null}
      </div>
      <FormMessage state={activateState} />
      <FormMessage state={deleteState} />
    </div>
  );
}
