import { notFound } from "next/navigation";
import { Activity, Boxes, Building2, FileLock2, Rocket, ShieldCheck, Truck, Users } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isPlatformAdminEmail } from "@/lib/admin/platform";
import { getAdminOverviewForWorkspace } from "@/lib/admin/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

const countCards = [
  { key: "activeShipments", label: "Expéditions actives", icon: Truck },
  { key: "businesses", label: "Entreprises", icon: Building2 },
  { key: "products", label: "Produits", icon: Boxes },
  { key: "members", label: "Membres", icon: Users },
  { key: "pendingInvites", label: "Invitations", icon: ShieldCheck },
] as const;

const launchPlans = [
  { name: "Essentiel", price: "39 CAD", target: "Tres petite entreprise" },
  { name: "Pro", price: "89 CAD", target: "PME principale" },
  { name: "Business", price: "179 CAD", target: "Equipe et volume superieur" },
  { name: "Enterprise", price: "399+ CAD", target: "Sur mesure apres demande reelle" },
];

function formatShortId(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage({ params }: { params: LocaleParams }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.admin;
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !["owner", "admin"].includes(membership.role)) {
    notFound();
  }

  const overview = await getAdminOverviewForWorkspace(workspace.id);
  const isPlatformAdmin = isPlatformAdminEmail(user?.email);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {countCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={card.key}>
              <div className="flex items-center justify-between gap-4">
                <Icon aria-hidden="true" size={26} />
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">Live</span>
              </div>
              <p className="mt-6 text-4xl font-semibold tracking-tight text-neutral-950">{overview.counts[card.key]}</p>
              <p className="mt-2 text-base font-semibold text-[var(--muted)]">{card.label}</p>
            </article>
          );
        })}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Contrôle des accès</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.members.map((member) => (
              <div className="rounded-2xl bg-neutral-50 px-4 py-4" key={member.user_id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-neutral-950">{member.profile?.full_name ?? member.profile?.email ?? formatShortId(member.user_id)}</p>
                    {member.profile?.email ? <p className="mt-1 text-sm text-[var(--muted)]">{member.profile.email}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-neutral-700">{member.role}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-neutral-700">{member.status}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">Ajouté le {formatDate(member.created_at, locale)}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileLock2 aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Posture sécurité</h2>
          </div>
          <div className="mt-5 grid gap-3 text-base leading-7 text-[var(--muted)]">
            <p className="rounded-2xl bg-neutral-50 p-4">RLS actif: chaque lecture et écriture reste attachée au workspace courant.</p>
            <p className="rounded-2xl bg-neutral-50 p-4">Écritures sensibles: limitées à `owner` et `admin` côté serveur.</p>
            <p className="rounded-2xl bg-neutral-50 p-4">Google OAuth actif: redirections Supabase configurées pour local et `app.fixtarif.ca`.</p>
          </div>
        </article>
      </section>
      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Users aria-hidden="true" size={24} />
          <h2 className="text-2xl font-semibold tracking-tight">Invitations récentes</h2>
        </div>
        <div className="mt-5 grid gap-3">
          {overview.invites.length === 0 ? <p className="text-base text-[var(--muted)]">Aucune invitation préparée.</p> : null}
          {overview.invites.map((invite) => (
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
      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Activity aria-hidden="true" size={24} />
          <h2 className="text-2xl font-semibold tracking-tight">Dernière activité</h2>
        </div>
        <div className="mt-5 grid gap-3">
          {overview.auditLog.length === 0 ? <p className="text-base text-[var(--muted)]">Aucun événement enregistré pour l&apos;instant.</p> : null}
          {overview.auditLog.map((event) => (
            <div className="rounded-2xl bg-neutral-50 px-4 py-4" key={event.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base font-semibold text-neutral-950">{event.action.replaceAll("_", " ")}</p>
                <p className="text-sm font-semibold text-[var(--muted)]">{formatDate(event.created_at, locale)}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Utilisateur {event.actor_user_id ? formatShortId(event.actor_user_id) : "système"}
              </p>
            </div>
          ))}
        </div>
      </section>
      {isPlatformAdmin ? (
        <>
          <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Rocket aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Fixtarif interne</h2>
            </div>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">
              MVP PME: importer, vérifier, générer. API/ERP restent hors lancement tant que les clients ne les demandent pas.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {launchPlans.map((plan) => (
                <article className="rounded-2xl bg-neutral-50 p-4" key={plan.name}>
                  <p className="text-base font-semibold text-neutral-950">{plan.name}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{plan.price}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{plan.target}</p>
                </article>
              ))}
            </div>
            <p className="mt-5 rounded-2xl bg-neutral-50 p-4 text-base font-semibold text-neutral-800">
              Offre de lancement: 45 jours gratuits sur Pro pour les 30 premières entreprises.
            </p>
          </section>
          <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileLock2 aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Portails clients support</h2>
            </div>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">
              Fonctionnalité prévue: voir l&apos;état d&apos;un portail client pour aider, seulement avec consentement explicite, journalisation complète et accès temporaire.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <p className="rounded-2xl bg-neutral-50 p-4 text-base font-semibold text-neutral-800">Consentement client requis</p>
              <p className="rounded-2xl bg-neutral-50 p-4 text-base font-semibold text-neutral-800">Accès limité dans le temps</p>
              <p className="rounded-2xl bg-neutral-50 p-4 text-base font-semibold text-neutral-800">Audit complet obligatoire</p>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
