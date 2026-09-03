import { MailPlus, ShieldCheck, UserRound, Users } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { inviteTeamMember } from "@/lib/team/actions";
import { getTeamForWorkspace } from "@/lib/team/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type TeamPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

function formatShortId(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.team;
  const { workspace, membership } = await getCurrentWorkspace();
  const team = workspace ? await getTeamForWorkspace(workspace.id) : { members: [], invites: [] };
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const inviteTeamMemberAction = inviteTeamMember.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MailPlus aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Inviter un membre</h2>
          </div>
          {canManage ? (
            <form action={inviteTeamMemberAction} className="mt-6 grid gap-4">
              <label className="block text-base font-semibold">
                Courriel
                <input className="field" name="email" placeholder="collegue@entreprise.com" required type="email" />
              </label>
              <label className="block text-base font-semibold">
                Rôle
                <select className="field" defaultValue="member" name="role">
                  <option value="member">Member - utilisation quotidienne</option>
                  <option value="admin">Admin - gestion des données</option>
                </select>
              </label>
              <button className="primary-button inline-flex items-center justify-center gap-2" type="submit">
                <MailPlus aria-hidden="true" size={20} />
                Préparer l&apos;invitation
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">Lecture seule. Un rôle owner ou admin est requis.</p>
          )}
        </article>
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Users aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Membres actifs</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {team.members.map((member) => (
              <div className="rounded-2xl bg-neutral-50 px-4 py-4" key={member.user_id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="inline-flex items-center gap-3 text-base font-semibold text-neutral-950">
                    <UserRound aria-hidden="true" size={20} />
                    {formatShortId(member.user_id)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-neutral-700">{member.role}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-neutral-700">{member.status}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">Depuis le {formatDate(member.created_at, locale)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck aria-hidden="true" size={24} />
          <h2 className="text-2xl font-semibold tracking-tight">Invitations préparées</h2>
        </div>
        <div className="mt-5 grid gap-3">
          {team.invites.length === 0 ? <p className="text-base text-[var(--muted)]">Aucune invitation préparée pour l&apos;instant.</p> : null}
          {team.invites.map((invite) => (
            <div className="rounded-2xl bg-neutral-50 px-4 py-4" key={invite.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base font-semibold text-neutral-950">{invite.email}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-neutral-700">{invite.role}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-neutral-700">{invite.status}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">Expire le {formatDate(invite.expires_at, locale)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
