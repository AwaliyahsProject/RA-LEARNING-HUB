"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { friendlyDbError } from "@/lib/errors";
import { fieldErrorsFrom, readFields, type FormState } from "@/lib/forms";
import { HOME_PATH } from "@/config/routes";
import { forgotPasswordSchema, newPasswordSchema, passwordErrorMessage, profileSchema } from "./schemas";

export async function updateOwnProfile(_prev: FormState<"fullName">, formData: FormData): Promise<FormState<"fullName">> {
  const profile = await requireProfile();
  const values = readFields(formData, ["fullName"] as const);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<"fullName">(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", profile.id);
  if (error) return { status: "error", values, message: friendlyDbError(error, "updateOwnProfile") };

  revalidatePath("/", "layout");
  return { status: "success", values, message: "Profil tersimpan." };
}

export async function updatePassword(
  _prev: FormState<"password" | "confirm">,
  formData: FormData,
): Promise<FormState<"password" | "confirm">> {
  await requireProfile();
  const parsed = newPasswordSchema.safeParse(readFields(formData, ["password", "confirm"] as const));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom<"password" | "confirm">(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[auth] updateUser password:", error.code, error.message);
    return { status: "error", message: passwordErrorMessage(error.code) };
  }
  redirect(`${HOME_PATH}?pesan=sandi-tersimpan`);
}

/**
 * Always reports success so the form cannot be used to discover which emails
 * have accounts. Supabase rate-limits the underlying email sending.
 */
export async function requestPasswordReset(_prev: FormState<"email">, formData: FormData): Promise<FormState<"email">> {
  const values = readFields(formData, ["email"] as const);
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { status: "error", values, fieldErrors: fieldErrorsFrom<"email">(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error) console.error("[auth] resetPasswordForEmail:", error.code, error.message);

  return {
    status: "success",
    message: "Jika email tersebut terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim. Periksa kotak masuk atau folder spam.",
  };
}
