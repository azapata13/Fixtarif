import { Mail, Phone, Plus, Sparkles, Truck } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createCarrier, seedDemoCarriers } from "@/lib/carriers/actions";
import { getCarriersForWorkspace } from "@/lib/carriers/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type CarriersPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function CarriersPage({ params, searchParams }: CarriersPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.carriers;
  const { workspace, membership } = await getCurrentWorkspace();
  const carriers = workspace ? await getCarriersForWorkspace(workspace.id) : [];
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const hasDemoCarriers = carriers.some((carrier) => carrier.name === "Nordik Transport") && carriers.some((carrier) => carrier.name === "Lakeside Freight");
  const createCarrierAction = createCarrier.bind(null, locale);
  const seedDemoCarriersAction = seedDemoCarriers.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      {canManage ? (
        <section className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <form action={createCarrierAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Plus aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Ajouter un transporteur</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold">
                Nom
                <input className="field" name="name" required />
              </label>
              <label className="block text-base font-semibold">
                Type
                <select className="field" name="carrierType" defaultValue="ltl">
                  <option value="ltl">LTL</option>
                  <option value="ftl">FTL</option>
                  <option value="flatbed">Flatbed</option>
                  <option value="parcel">Colis</option>
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
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm md:col-span-2">
                <input className="h-5 w-5 accent-black" name="defaultProvidesBol" type="checkbox" />
                Fournit son propre connaissement par défaut
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
          <form action={seedDemoCarriersAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Données de test</h2>
            </div>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">Ajoute deux transporteurs pour tester le prochain workflow d&apos;expédition.</p>
            {hasDemoCarriers ? (
              <p className="mt-6 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">Transporteurs de démonstration déjà ajoutés.</p>
            ) : (
              <button className="secondary-button mt-6" type="submit">
                Ajouter les deux transporteurs
              </button>
            )}
          </form>
        </section>
      ) : null}
      <p className="mb-4 text-base font-semibold text-[var(--muted)]">
        {carriers.length} transporteur{carriers.length > 1 ? "s" : ""}
      </p>
      <section className="grid gap-4 xl:grid-cols-2">
        {carriers.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
            <p className="text-lg leading-7 text-[var(--muted)]">Aucun transporteur dans ce workspace pour l&apos;instant.</p>
          </div>
        ) : null}
        {carriers.map((carrier) => (
          <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={carrier.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{carrier.carrier_type}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{carrier.name}</h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">{carrier.active ? "Actif" : "Inactif"}</span>
            </div>
            <div className="mt-6 grid gap-3 text-base text-neutral-700">
              {carrier.email ? (
                <p className="flex items-center gap-3">
                  <Mail aria-hidden="true" size={20} />
                  {carrier.email}
                </p>
              ) : null}
              {carrier.phone ? (
                <p className="flex items-center gap-3">
                  <Phone aria-hidden="true" size={20} />
                  {carrier.phone}
                </p>
              ) : null}
              <p className="flex items-center gap-3">
                <Truck aria-hidden="true" size={20} />
                {carrier.default_provides_bol ? "Fournit son BOL" : "BOL Fixtarif possible plus tard"}
              </p>
            </div>
            {carrier.notes ? <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-base leading-7 text-[var(--muted)]">{carrier.notes}</p> : null}
          </article>
        ))}
      </section>
    </>
  );
}
