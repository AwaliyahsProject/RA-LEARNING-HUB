"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, toActor } from "@/lib/auth/session";
import { friendlyDbError } from "@/lib/errors";
import { fieldErrorsFrom, readFields, type FormState } from "@/lib/forms";
import { canInvite, canManageMember } from "./permissions";
import { inviteMemberSchema, memberIdSchema, type InviteMemberField } from "./schemas";

const MANAGERS = ["super_admin", "school_admin"] as const;

function revalidateMemberPages(schoolId: string) {
  revalidatePath("/sekolah/guru");
  revalidatePath(`/admin/sekolah/${schoolId}`);
}

/** Map Supabase Auth admin errors to friendly messages (never leak raw errors). */
function inviteErrorMessage(code: string | undefined): string {
  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return "Email ini sudah terdaftar. Gunakan email lain atau hubungi admin platform.";
    case "over_email_send_rate_limit":
      return "Batas pengiriman email tercapai. Coba lagi beberapa saat lagi.";
    case "email_address_invalid":
      return "Alamat email tidak dapat menerima undangan. Periksa kembali penulisannya.";
    default:
      return "Undangan belum terkirim. Periksa koneksi internet lalu coba lagi.";
  }
}

export async function inviteMember(_prev: FormState<InviteMemberField>, formData: FormData): Promise<FormState<InviteMemberField>> {
  const actor = toActor(await requireRole(MANAGERS));
  const raw = readFields(formData, ["schoolId", "fullName", "email", "role"] as const);
  const values = { fullName: raw.fullName, email: raw.email, role: raw.role };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", values, fieldErrors: fieldErrorsFrom<InviteMemberField>(parsed.error) };
  }
  const { schoolId, fullName, email, role } = parsed.data;

  if (!canInvite(actor, schoolId, role)) {
    return { status: "error", values, message: "Anda tidak memiliki izin mengundang dengan peran ini ke sekolah tersebut." };
  }

  // Confirm the school exists, is active and is visible to the caller (RLS).
  const supabase = await createClient();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, is_active")
    .eq("id", schoolId)
    .maybeSingle();
  if (schoolError) return { status: "error", values, message: friendlyDbError(schoolError, "inviteMember.school") };
  if (!school || !school.is_active) return { status: "error", values, message: "Sekolah tidak ditemukan atau tidak aktif." };

  // Service role is required: only it may send invitations and write app_metadata.
  const admin = createAdminClient();

  // Supabase silently RE-SENDS an invitation when the email belongs to a user who
  // has not accepted yet (instead of failing). Check first, across all schools,
  // so an invite never "succeeds" for an account that stays in another school.
  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("school_id, joined_at")
    .eq("email", email)
    .maybeSingle();
  if (existingError) return { status: "error", values, message: friendlyDbError(existingError, "inviteMember.existing") };
  if (existing) {
    const pendingHere = existing.school_id === schoolId && !existing.joined_at;
    return {
      status: "error",
      values,
      fieldErrors: { email: "Email ini sudah terdaftar." },
      message: pendingHere
        ? "Email ini sudah diundang dan belum menerima undangan. Gunakan tombol \"Kirim ulang\" di daftar anggota."
        : "Email ini sudah terdaftar. Gunakan email lain atau hubungi admin platform.",
    };
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (inviteError || !invited.user) {
    console.error("[auth] inviteUserByEmail:", inviteError?.code, inviteError?.message);
    return { status: "error", values, message: inviteErrorMessage(inviteError?.code) };
  }

  // The DB trigger turns this app_metadata into the profile's role & school.
  const { error: metaError } = await admin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: { role, school_id: schoolId, invited_by: actor.id },
  });
  if (metaError) {
    console.error("[auth] assign invited user:", metaError.code, metaError.message);
    await admin.auth.admin.deleteUser(invited.user.id); // never leave an unassigned account behind
    return { status: "error", values, message: "Undangan belum terkirim. Silakan coba lagi." };
  }

  revalidateMemberPages(schoolId);
  return { status: "success", message: `Undangan terkirim ke ${email}.` };
}

async function loadManageableMember(memberId: unknown) {
  const actor = toActor(await requireRole(MANAGERS));
  const id = memberIdSchema.safeParse(memberId);
  if (!id.success) return { error: "Data anggota tidak valid." } as const;

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("profiles")
    .select("id, email, role, school_id, is_active, joined_at")
    .eq("id", id.data)
    .maybeSingle();
  if (error) return { error: friendlyDbError(error, "loadManageableMember") } as const;
  if (!member || !canManageMember(actor, { id: member.id, role: member.role, schoolId: member.school_id })) {
    return { error: "Anda tidak memiliki izin mengelola akun ini." } as const;
  }
  return { member, supabase } as const;
}

export async function resendInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await loadManageableMember(formData.get("memberId"));
  if ("error" in result) return { status: "error", message: result.error };
  const { member } = result;

  if (member.joined_at) return { status: "error", message: "Anggota ini sudah bergabung." };
  if (!member.email) return { status: "error", message: "Anggota ini tidak memiliki email." };

  const { error } = await createAdminClient().auth.admin.inviteUserByEmail(member.email);
  if (error) {
    console.error("[auth] resend invite:", error.code, error.message);
    return { status: "error", message: inviteErrorMessage(error.code) };
  }

  if (member.school_id) revalidateMemberPages(member.school_id);
  return { status: "success", message: `Undangan dikirim ulang ke ${member.email}.` };
}

export async function setMemberActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await loadManageableMember(formData.get("memberId"));
  if ("error" in result) return { status: "error", message: result.error };
  const { member, supabase } = result;
  const active = formData.get("active") === "true";

  // Uses the caller's own client: RLS + profiles_guard_update re-check everything.
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("id", member.id)
    .select("id");
  if (error) return { status: "error", message: friendlyDbError(error, "setMemberActive") };
  if (!data?.length) return { status: "error", message: "Anda tidak memiliki izin mengelola akun ini." };

  if (member.school_id) revalidateMemberPages(member.school_id);
  return { status: "success", message: active ? "Akun diaktifkan kembali." : "Akun dinonaktifkan." };
}
