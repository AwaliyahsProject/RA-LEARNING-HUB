"use client";

import { useActionState } from "react";
import { MailPlus, UserCheck, UserX } from "lucide-react";
import { resendInvitation, setMemberActive } from "@/features/members/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms";
import type { MemberStatus } from "./queries";

export function MemberActions({ memberId, name, status }: { memberId: string; name: string; status: MemberStatus }) {
  const [resendState, resendAction] = useActionState(resendInvitation, idleState);
  const [toggleState, toggleAction] = useActionState(setMemberActive, idleState);
  const toggleFormId = `toggle-${memberId}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <form action={resendAction}>
            <input type="hidden" name="memberId" value={memberId} />
            <SubmitButton variant="secondary" pendingLabel="Mengirim…">
              <MailPlus aria-hidden className="size-4" />
              Kirim ulang
            </SubmitButton>
          </form>
        ) : null}

        <form id={toggleFormId} action={toggleAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="active" value={status === "inactive" ? "true" : "false"} />
          {status === "inactive" ? (
            <SubmitButton variant="secondary" pendingLabel="Mengaktifkan…">
              <UserCheck aria-hidden className="size-4" />
              Aktifkan
            </SubmitButton>
          ) : null}
        </form>
        {status === "inactive" ? null : (
          <ConfirmDialog
            formId={toggleFormId}
            title={`Nonaktifkan ${name}?`}
            description="Akun ini tidak akan bisa mengakses data sekolah sampai diaktifkan kembali. Data yang sudah dibuat tetap tersimpan."
            confirmLabel="Ya, nonaktifkan"
            trigger={
              <>
                <UserX aria-hidden className="size-4" />
                Nonaktifkan
              </>
            }
          />
        )}
      </div>
      <FormMessage state={resendState} />
      <FormMessage state={toggleState} />
    </div>
  );
}
