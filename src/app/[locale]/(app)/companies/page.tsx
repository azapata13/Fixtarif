import { Clock, Mail, MapPin, Phone, Plus, Sparkles, UserRound, Warehouse } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createBusiness, createBusinessContact, createBusinessSite, seedDemoBusinesses } from "@/lib/businesses/actions";
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
  const createBusinessSiteAction = createBusinessSite.bind(null, locale);
  const createBusinessContactAction = createBusinessContact.bind(null, locale);
  const seedDemoBusinessesAction = seedDemoBusinesses.bind(null, locale);
  const allSites = businesses.flatMap((business) => {
    const sites = Array.isArray(business.business_sites) ? business.business_sites : business.business_sites ? [business.business_sites] : [];
    return sites.map((site) => ({ ...site, businessId: business.id, businessName: business.name }));
  });

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
      {canManage && businesses.length > 0 ? (
        <section className="mb-6 grid gap-4 xl:grid-cols-2">
          <form action={createBusinessSiteAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Warehouse aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Ajouter un site</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold md:col-span-2">
                Entreprise
                <select className="field" name="businessId" required>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-base font-semibold">
                Nom du site
                <input className="field" name="siteName" placeholder="Principal" />
              </label>
              <label className="block text-base font-semibold">
                Pays
                <select className="field" name="country" defaultValue="CA">
                  <option value="CA">Canada</option>
                  <option value="US">États-Unis</option>
                </select>
              </label>
              <label className="block text-base font-semibold md:col-span-2">
                Adresse
                <input className="field" name="address" />
              </label>
              <label className="block text-base font-semibold">
                Ville
                <input className="field" name="city" />
              </label>
              <label className="block text-base font-semibold">
                Province / État
                <input className="field" name="region" />
              </label>
              <label className="block text-base font-semibold">
                Code postal / ZIP
                <input className="field" name="postalCode" />
              </label>
              <label className="block text-base font-semibold">
                Appel avant livraison
                <input className="field" min="0" name="callBeforeMinutes" placeholder="30" type="number" />
              </label>
              <label className="block text-base font-semibold md:col-span-2">
                Info quai
                <input className="field" name="dockInfo" />
              </label>
              <label className="flex min-h-16 items-center gap-3 rounded-[20px] border border-[var(--line)] bg-neutral-50 px-4 text-base font-semibold">
                <input className="h-5 w-5 accent-black" name="appointmentRequired" type="checkbox" />
                Rendez-vous requis
              </label>
              <label className="flex min-h-16 items-center gap-3 rounded-[20px] border border-[var(--line)] bg-neutral-50 px-4 text-base font-semibold">
                <input className="h-5 w-5 accent-black" name="flatbedRequired" type="checkbox" />
                Flatbed requis
              </label>
              <label className="block text-base font-semibold md:col-span-2">
                Notes
                <textarea className="field min-h-24 resize-y" name="notes" />
              </label>
            </div>
            <button className="primary-button mt-6" type="submit">
              Enregistrer le site
            </button>
          </form>
          <form action={createBusinessContactAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Ajouter un contact</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold">
                Entreprise
                <select className="field" name="businessId" required>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-base font-semibold">
                Site
                <select className="field" name="siteId" defaultValue="">
                  <option value="">Non assigné</option>
                  {allSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.businessName} - {site.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-base font-semibold">
                Nom
                <input className="field" name="contactName" required />
              </label>
              <label className="block text-base font-semibold">
                Rôle
                <input className="field" name="contactRole" placeholder="Réception" />
              </label>
              <label className="block text-base font-semibold">
                Type
                <select className="field" name="contactType" defaultValue="receiving">
                  <option value="receiving">Réception</option>
                  <option value="shipping">Expédition</option>
                  <option value="commercial">Commercial</option>
                  <option value="project">Projet</option>
                  <option value="accounting">Comptabilité</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label className="block text-base font-semibold">
                Extension
                <input className="field" name="extension" />
              </label>
              <label className="block text-base font-semibold">
                Courriel
                <input className="field" name="email" type="email" />
              </label>
              <label className="block text-base font-semibold">
                Téléphone
                <input className="field" name="phone" />
              </label>
            </div>
            <button className="primary-button mt-6" type="submit">
              Enregistrer le contact
            </button>
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
                {site?.appointment_required ? (
                  <p className="flex items-center gap-3">
                    <Clock aria-hidden="true" size={20} />
                    Rendez-vous requis
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
