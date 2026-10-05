"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteClass } from "@/features/classes/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { idleState } from "@/lib/forms";

export function DeleteClass({ classId, name }: { classId: string; name: string }) {
  const [state, action] = useActionState(deleteClass, idleState);
  const formId = `delete-class-${classId}`;
  return (
    <div className="space-y-2">
      <form id={formId} action={action}>
        <input type="hidden" name="classId" value={classId} />
      </form>
      <ConfirmDialog
        formId={formId}
        triggerVariant="ghost"
        title={`Hapus ${name}?`}
        description="Penugasan guru di kelas ini ikut terhapus. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, hapus kelas"
        trigger={
          <>
            <Trash2 aria-hidden className="size-4" />
            Hapus kelas
          </>
        }
      />
      <FormMessage state={state} />
    </div>
  );
}
