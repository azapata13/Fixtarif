import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { NewShipmentForm } from "@/components/new-shipment-form";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getBusinessesForWorkspace } from "@/lib/businesses/queries";
import { getCarriersForWorkspace } from "@/lib/carriers/queries";
import { getProductsForWorkspace } from "@/lib/products/queries";
import { createShipmentDraft } from "@/lib/shipments/actions";
import { getNextShipmentReference } from "@/lib/shipments/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type NewShipmentPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function NewShipmentPage({ params, searchParams }: NewShipmentPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const { workspace } = await getCurrentWorkspace();
  const businesses = workspace ? await getBusinessesForWorkspace(workspace.id) : [];
  const products = workspace ? await getProductsForWorkspace(workspace.id) : [];
  const carriers = workspace ? await getCarriersForWorkspace(workspace.id) : [];
  const nextReference = workspace ? await getNextShipmentReference(workspace.id) : "ST-0001";
  const createShipmentDraftAction = createShipmentDraft.bind(null, locale);

  return (
    <>
      <Link className="mb-6 inline-flex items-center gap-2 text-base font-semibold text-neutral-700" href={`/${locale}/shipments`}>
        <ArrowLeft aria-hidden="true" size={20} />
        Retour
      </Link>
      <PageHeader title="Nouvelle expédition Canada" description="Créer un brouillon manuel avec validation humaine de la quantité et du poids." />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <NewShipmentForm action={createShipmentDraftAction} businesses={businesses} carriers={carriers} nextReference={nextReference} products={products} />
    </>
  );
}
