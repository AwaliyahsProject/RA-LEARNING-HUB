"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImageUp, School, Trash2 } from "lucide-react";
import { removeSchoolLogo, uploadSchoolLogo } from "@/features/schools/actions";
import { LOGO_MAX_BYTES, LOGO_TYPES } from "@/features/schools/schemas";
import { Alert } from "@/components/ui/alert";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState, type FormState } from "@/lib/forms";

export function LogoUploader({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [uploadState, upload] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await uploadSchoolLogo(prev, formData);
    if (result.status === "success") {
      formRef.current?.reset();
      setPreview(null);
    }
    return result;
  }, idleState);
  const [removeState, remove] = useActionState(removeSchoolLogo, idleState);

  // Release the object URL when the preview changes or the component unmounts.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? currentUrl;

  return (
    <div className="space-y-4">
      <div className="grid size-32 place-items-center overflow-hidden rounded-2xl border border-line bg-canvas">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo from Supabase Storage / blob preview
          <img src={shown} alt="Logo sekolah" className="size-full object-contain p-2" />
        ) : (
          <School aria-hidden className="size-12 text-ink-muted" />
        )}
      </div>

      <form ref={formRef} action={upload} className="space-y-3">
        <label htmlFor="logo" className="block text-sm font-semibold">
          Pilih gambar logo
        </label>
        <input
          id="logo"
          name="logo"
          type="file"
          accept={Object.keys(LOGO_TYPES).join(",")}
          className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:font-semibold file:text-brand-700"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setClientError(null);
            setPreview(null);
            if (!file) return;
            if (file.size > LOGO_MAX_BYTES) {
              setClientError("Ukuran logo maksimal 1 MB.");
              event.target.value = "";
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
        <p className="text-xs text-ink-muted">PNG, JPG, atau WebP. Maksimal 1 MB. Disarankan berbentuk persegi.</p>
        {clientError ? <Alert tone="error">{clientError}</Alert> : null}
        <FormMessage state={uploadState} />
        <SubmitButton variant="secondary" disabled={!preview} pendingLabel="Mengunggah…">
          <ImageUp aria-hidden className="size-4" />
          Unggah logo
        </SubmitButton>
      </form>

      {currentUrl ? (
        <form action={remove}>
          <SubmitButton variant="ghost" pendingLabel="Menghapus…">
            <Trash2 aria-hidden className="size-4" />
            Hapus logo
          </SubmitButton>
          <FormMessage state={removeState} />
        </form>
      ) : null}
    </div>
  );
}
