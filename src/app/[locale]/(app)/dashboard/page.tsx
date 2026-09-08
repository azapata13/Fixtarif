import Link from "next/link";
import { ArrowRight, Building2, FileText, Package, Plus, Sparkles, Truck, Upload } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { prepareDemoWorkspace } from "@/lib/demo/actions";
import { getShipmentsForWorkspace } from "@/lib/shipments/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

const libraryLinks = [
  { description: "Clients, adresses de livraison et contacts.", href: "companies", icon: Building2, title: "Clients et adresses" },
  { description: "Pièces, poids, dimensions et valeurs.", href: "products", icon: Package, title: "Produits" },
  { description: "Transporteurs et préférences de connaissement.", href: "carriers", icon: Truck, title: "Transporteurs" },
] as const;

function shipmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    archived: "archivé",
    draft: "brouillon",
    ready: "prêt",
    validation: "en validation",
  };

  return labels[status] ?? status;
}

export default async function DashboardPage({ params, searchParams }: { params: LocaleParams; searchParams: Promise<{ message?: string }> }) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.dashboard;
  const { workspace } = await getCurrentWorkspace();
  const shipments = workspace ? (await getShipmentsForWorkspace(workspace.id)).slice(0, 3) : [];
  const prepareDemoWorkspaceAction = prepareDemoWorkspace.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <section className="mb-6 rounded-[28px] border border-[var(--line)] bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Préparer une expédition</h2>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-[var(--muted)]">
              Commence manuellement ou importe une feuille. Fixtarif te demande ensuite seulement ce qui manque avant les documents.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[480px]">
            <Link className="primary-button inline-flex items-center justify-center gap-2" href={`/${locale}/shipments/new`}>
              <Plus aria-hidden="true" size={22} />
              Nouvelle expédition
            </Link>
            <Link className="secondary-button inline-flex items-center justify-center gap-2" href={`/${locale}/documents`}>
              <Upload aria-hidden="true" size={21} />
              Importer un document
            </Link>
          </div>
        </div>
      </section>
      <section className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Mode démo MVP</h2>
            </div>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
              Prépare les clients, produits, transporteurs, courtiers et deux brouillons Canada/USA pour tester vite sans données sensibles.
            </p>
          </div>
          <form action={prepareDemoWorkspaceAction}>
            <button className="secondary-button min-w-56" type="submit">
              Préparer la démo
            </button>
          </form>
        </div>
      </section>
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <Link
          className="focus-ring rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
          href={`/${locale}/shipments`}
        >
          <div className="flex items-center justify-between gap-4">
            <Truck aria-hidden="true" className="text-neutral-950" size={28} />
            <ArrowRight aria-hidden="true" className="text-neutral-400" size={22} />
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-tight">Voir les expéditions</h2>
          <p className="mt-3 text-base leading-6 text-[var(--muted)]">Retrouver les brouillons, corriger ce qui manque et générer les documents.</p>
        </Link>
        <Link
          className="focus-ring rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
          href={`/${locale}/documents`}
        >
          <div className="flex items-center justify-between gap-4">
            <FileText aria-hidden="true" className="text-neutral-950" size={28} />
            <ArrowRight aria-hidden="true" className="text-neutral-400" size={22} />
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-tight">Documents importés</h2>
          <p className="mt-3 text-base leading-6 text-[var(--muted)]">Déposer une feuille, vérifier les informations et garder les fichiers privés.</p>
        </Link>
      </section>
      <section className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Données enregistrées</h2>
            <p className="mt-2 text-base leading-7 text-[var(--muted)]">À préparer une fois, puis Fixtarif les réutilise dans les expéditions.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {libraryLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="focus-ring rounded-2xl bg-neutral-50 p-4 transition hover:bg-neutral-100"
              href={`/${locale}/${item.href}`}
              key={item.href}
            >
              <div className="flex items-center justify-between gap-4">
                <Icon aria-hidden="true" className="text-neutral-950" size={23} />
                <ArrowRight aria-hidden="true" className="text-neutral-400" size={18} />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
            </Link>
          );
        })}
        </div>
      </section>
      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Expéditions récentes</h2>
          <Link className="secondary-button !min-h-11 !px-5 !py-2 !text-sm" href={`/${locale}/shipments`}>
            Voir tout
          </Link>
        </div>
        <div className="mt-5 grid gap-3">
          {shipments.length === 0 ? <p className="text-base text-[var(--muted)]">Aucun brouillon pour l&apos;instant.</p> : null}
          {shipments.map((shipment) => {
            const item = Array.isArray(shipment.shipment_items) ? shipment.shipment_items[0] : shipment.shipment_items;
            return (
              <Link className="focus-ring flex flex-col gap-2 rounded-2xl bg-neutral-50 px-4 py-4 transition hover:bg-neutral-100 sm:flex-row sm:items-center sm:justify-between" href={`/${locale}/shipments/${shipment.id}`} key={shipment.id}>
                <span>
                  <span className="block text-base font-semibold text-neutral-950">{shipment.reference}</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">{item?.name ?? "Produit à compléter"}</span>
                </span>
                <span className="text-sm font-semibold uppercase text-[var(--muted)]">{shipmentStatusLabel(shipment.status)}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
