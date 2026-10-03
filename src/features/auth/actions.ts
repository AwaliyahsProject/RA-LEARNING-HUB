"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH, safeRedirectPath } from "@/config/routes";
import { signInErrorMessage, signInSchema, type SignInState } from "@/features/auth/schemas";

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      email,
      fieldErrors: { email: errors.email?.[0], password: errors.password?.[0] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", email, message: signInErrorMessage(error.code) };
  }

  redirect(safeRedirectPath(parsed.data.next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
