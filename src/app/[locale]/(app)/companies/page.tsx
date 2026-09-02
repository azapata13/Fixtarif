import { Mail, MapPin, Phone, Plus, Sparkles, UserRound } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createBusiness, seedDemoBusinesses } from "@/lib/businesses/actions";
import { getBusinessesForWorkspace } from "@/lib/businesses/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type CompaniesPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function CompaniesPage({ params, searchParams }: CompaniesPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.companies;
  const { workspace, membership } = await getCurrentWorkspace();
  const businesses = workspace ? await getBusinessesForWorkspace(workspace.id) : [];
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const hasDemoClients = businesses.some((business) => business.name === "Atelier Nordik") && businesses.some((business) => business.name === "Great Lakes Fabrication");
  const createBusinessAction = createBusiness.bind(null, locale);
  const seedDemoBusinessesAction = seedDemoBusinesses.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      {canManage ? (
        <section className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <form action={createBusinessAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Plus aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Ajouter une entreprise</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold">
                Nom
                <input className="field" name="name" required />
              </label>
              <label className="block text-base font-semibold">
                Type
                <select className="field" name="role" defaultValue="client">
                  <option value="client">Client</option>
                  <option value="supplier">Fournisseur</option>
                  <option value="subcontractor">Sous-traitant</option>
                  <option value="consignee">Consignataire</option>
                  <option value="buyer">Acheteur</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label className="block text-base font-semibold">
                Courriel
                <input className="field" name="email" type="email" />
              </label>
              <label className="block text-base font-semibold">
                Téléphone
                <input className="field" name="phone" />
              </label>
              <label className="block text-base font-semibold md:col-span-2">
                Notes
                <textarea className="field min-h-28 resize-y" name="notes" />
              </label>
            </div>
            <button className="primary-button mt-6" type="submit">
              Enregistrer
            </button>
          </form>
          <form action={seedDemoBusinessesAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Données de test</h2>
            </div>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              Ajoute Atelier Nordik et Great Lakes Fabrication dans ce workspace pour tester les cartes et les prochains workflows.
            </p>
            {hasDemoClients ? (
              <p className="mt-6 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">Clients de démonstration déjà ajoutés.</p>
            ) : (
              <button className="secondary-button mt-6" type="submit">
                Ajouter les deux clients
              </button>
            )}
          </form>
        </section>
      ) : null}
      <p className="mb-4 text-base font-semibold text-[var(--muted)]">{businesses.length} entreprise{businesses.length > 1 ? "s" : ""}</p>
      <section className="grid gap-4 xl:grid-cols-2">
        {businesses.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
            <p className="text-lg leading-7 text-[var(--muted)]">Aucune entreprise dans ce workspace pour l&apos;instant.</p>
          </div>
        ) : null}
        {businesses.map((business) => {
          const site = Array.isArray(business.business_sites) ? business.business_sites[0] : business.business_sites;
          const contact = Array.isArray(business.contacts) ? business.contacts[0] : business.contacts;
          const role = business.roles[0] ?? "client";

          return (
          <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={business.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{role}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{business.name}</h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">Workspace</span>
            </div>
            <div className="mt-6 grid gap-3 text-base text-neutral-700">
              {site ? (
                <p className="flex items-center gap-3">
                  <MapPin aria-hidden="true" size={20} />
                  {[site.city, site.region].filter(Boolean).join(", ") || site.country}
                </p>
              ) : null}
              {contact ? (
                <p className="flex items-center gap-3">
                  <UserRound aria-hidden="true" size={20} />
                  {contact.name}
                </p>
              ) : null}
              {business.email || contact?.email ? (
                <p className="flex items-center gap-3">
                  <Mail aria-hidden="true" size={20} />
                  {business.email ?? contact?.email}
                </p>
              ) : null}
              {business.phone || contact?.phone ? (
                <p className="flex items-center gap-3">
                  <Phone aria-hidden="true" size={20} />
                  {business.phone ?? contact?.phone}
                </p>
              ) : null}
            </div>
            {business.notes ? <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-base leading-7 text-[var(--muted)]">{business.notes}</p> : null}
          </article>
          );
        })}
      </section>
    </>
  );
}
