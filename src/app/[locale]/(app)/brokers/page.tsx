import { BadgeCheck, Mail, MapPin, Phone, Plus, Sparkles, UserRound } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createBroker, seedDemoBrokers } from "@/lib/brokers/actions";
import { getBrokersForWorkspace } from "@/lib/brokers/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type BrokersPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function BrokersPage({ params, searchParams }: BrokersPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.brokers;
  const { workspace, membership } = await getCurrentWorkspace();
  const brokers = workspace ? await getBrokersForWorkspace(workspace.id) : [];
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const hasDemoBrokers = brokers.some((broker) => broker.name === "Frontier Customs Services") && brokers.some((broker) => broker.name === "Pont Nord Brokerage");
  const createBrokerAction = createBroker.bind(null, locale);
  const seedDemoBrokersAction = seedDemoBrokers.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      {canManage ? (
        <section className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <form action={createBrokerAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Plus aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Ajouter un courtier</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold">
                Nom
                <input className="field" name="name" required />
              </label>
              <label className="block text-base font-semibold">
                Contact
                <input className="field" name="contactName" />
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
                Adresse
                <input className="field" name="address" />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm md:col-span-2">
                <input className="h-5 w-5 accent-black" name="isDefaultUsa" type="checkbox" />
                Courtier USA par défaut
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
          <form action={seedDemoBrokersAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Données de test</h2>
            </div>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">Ajoute deux courtiers pour préparer le futur workflow USA, sans automatiser de règles douanières.</p>
            {hasDemoBrokers ? (
              <p className="mt-6 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">Courtiers de démonstration déjà ajoutés.</p>
            ) : (
              <button className="secondary-button mt-6" type="submit">
                Ajouter les deux courtiers
              </button>
            )}
          </form>
        </section>
      ) : null}
      <p className="mb-4 text-base font-semibold text-[var(--muted)]">
        {brokers.length} courtier{brokers.length > 1 ? "s" : ""}
      </p>
      <section className="grid gap-4 xl:grid-cols-2">
        {brokers.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
            <p className="text-lg leading-7 text-[var(--muted)]">Aucun courtier dans ce workspace pour l&apos;instant.</p>
          </div>
        ) : null}
        {brokers.map((broker) => (
          <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={broker.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{broker.is_default_usa ? "USA par défaut" : "Courtier"}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{broker.name}</h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">{broker.active ? "Actif" : "Inactif"}</span>
            </div>
            <div className="mt-6 grid gap-3 text-base text-neutral-700">
              {broker.contact_name ? (
                <p className="flex items-center gap-3">
                  <UserRound aria-hidden="true" size={20} />
                  {broker.contact_name}
                </p>
              ) : null}
              {broker.email ? (
                <p className="flex items-center gap-3">
                  <Mail aria-hidden="true" size={20} />
                  {broker.email}
                </p>
              ) : null}
              {broker.phone ? (
                <p className="flex items-center gap-3">
                  <Phone aria-hidden="true" size={20} />
                  {broker.phone}
                </p>
              ) : null}
              {broker.address ? (
                <p className="flex items-center gap-3">
                  <MapPin aria-hidden="true" size={20} />
                  {broker.address}
                </p>
              ) : null}
              {broker.is_default_usa ? (
                <p className="flex items-center gap-3">
                  <BadgeCheck aria-hidden="true" size={20} />
                  Sélectionné par défaut pour USA
                </p>
              ) : null}
            </div>
            {broker.notes ? <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-base leading-7 text-[var(--muted)]">{broker.notes}</p> : null}
          </article>
        ))}
      </section>
    </>
  );
}
