import type { z } from "zod";

/**
 * Shared shape returned by Server Actions used with `useActionState`.
 * `values` echoes text inputs back so a failed submit doesn't wipe the form.
 */
export type FormState<F extends string = string> = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<F, string>>;
  values?: Partial<Record<F, string>>;
};

export const idleState: FormState = { status: "idle" };

/** First error message per field, from a failed Zod parse. */
export function fieldErrorsFrom<F extends string>(error: z.ZodError): Partial<Record<F, string>> {
  const out: Partial<Record<F, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key as F] = issue.message;
  }
  return out;
}

/** Read the given text fields from FormData (missing → ""). */
export function readFields<F extends string>(formData: FormData, fields: readonly F[]): Record<F, string> {
  const out = {} as Record<F, string>;
  for (const f of fields) {
    const v = formData.get(f);
    out[f] = typeof v === "string" ? v : "";
  }
  return out;
}
