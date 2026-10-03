import { UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { Actor } from "./permissions";
import { canManageMember, invitableRoles } from "./permissions";
import { listMembers, memberStatus, type MemberStatus } from "./queries";
import { InviteMemberForm } from "./invite-member-form";
import { MemberActions } from "./member-actions";
import type { UserRole } from "@/types/database";

const STATUS: Record<MemberStatus, { label: string; tone: "brand" | "accent" | "neutral" }> = {
  active: { label: "Aktif", tone: "brand" },
  pending: { label: "Menunggu undangan", tone: "accent" },
  inactive: { label: "Nonaktif", tone: "neutral" },
};

/** Member list + invite form for one school. Used by the school admin and the super admin. */
export async function MembersPanel({
  schoolId,
  actor,
  defaultRole,
}: {
  schoolId: string;
  actor: Actor;
  defaultRole: UserRole;
}) {
  const members = await listMembers(schoolId);
  const roles = invitableRoles(actor);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <section aria-labelledby="daftar-anggota" className="min-w-0">
        <h2 id="daftar-anggota" className="mb-3 text-lg font-bold">
          Anggota {members ? <span className="font-normal text-ink-muted">({members.length})</span> : null}
        </h2>
        {members === null ? (
          <ErrorState description="Daftar anggota belum bisa dimuat. Muat ulang halaman ini." />
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada anggota" description="Kirim undangan pertama melalui formulir di samping." />
        ) : (
          <ul className="space-y-3">
            {members.map((m) => {
              const status = memberStatus(m);
              const manageable = canManageMember(actor, { id: m.id, role: m.role, schoolId: m.schoolId });
              return (
                <li key={m.id}>
                  <Card className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {m.fullName}
                          {m.id === actor.id ? <span className="ml-1 font-normal text-ink-muted">(Anda)</span> : null}
                        </p>
                        <p className="break-all text-sm text-ink-muted">{m.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="neutral">{ROLE_LABELS[m.role]}</Badge>
                          <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
                        </div>
                      </div>
                      {manageable ? <MemberActions memberId={m.id} name={m.fullName} status={status} /> : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {roles.length > 0 ? (
        <Card className="lg:sticky lg:top-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
            <UserPlus aria-hidden className="size-5 text-brand-600" />
            Undang anggota
          </h2>
          <p className="mb-4 text-sm text-ink-muted">Undangan dikirim ke email. Penerima membuat kata sandinya sendiri.</p>
          <InviteMemberForm schoolId={schoolId} roles={roles} defaultRole={defaultRole} />
        </Card>
      ) : null}
    </div>
  );
}
