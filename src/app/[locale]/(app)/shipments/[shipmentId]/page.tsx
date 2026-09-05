import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ShipmentSectionCards } from "@/components/shipment-section-cards";
import { type Locale } from "@/i18n/config";
import { getBusinessesForWorkspace } from "@/lib/businesses/queries";
import { getCarriersForWorkspace } from "@/lib/carriers/queries";
import { getProductCustomsForProduct } from "@/lib/customs/queries";
import { generatePackingSlipDraft } from "@/lib/documents/actions";
import { getGeneratedDocumentsForShipment } from "@/lib/documents/queries";
import { getProductsForWorkspace } from "@/lib/products/queries";
import {
  duplicateShipmentDraft,
  updateShipmentDestination,
  updateShipmentGoodsAndPackage,
  updateShipmentStatus,
  updateShipmentTransportReferences,
} from "@/lib/shipments/actions";
import { getShipmentForWorkspace } from "@/lib/shipments/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type ShipmentDetailPageProps = {
  params: Promise<{ locale: string; shipmentId: string }>;
  searchParams: Promise<{ message?: string }>;
};

function getHtsStatusLabel(status?: string | null) {
  if (status === "validated") {
    return "HTS validé";
  }
  if (status === "needs_review") {
    return "HTS à vérifier";
  }
  if (status === "rejected") {
    return "HTS rejeté";
  }
  return "HTS manquant";
}

export default async function ShipmentDetailPage({ params, searchParams }: ShipmentDetailPageProps) {
  const { locale: localeParam, shipmentId } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const { workspace } = await getCurrentWorkspace();

  if (!workspace) {
    notFound();
  }

  const [shipment, generatedDocuments, businesses, products, carriers] = await Promise.all([
    getShipmentForWorkspace(workspace.id, shipmentId),
    getGeneratedDocumentsForShipment(workspace.id, shipmentId),
    getBusinessesForWorkspace(workspace.id),
    getProductsForWorkspace(workspace.id),
    getCarriersForWorkspace(workspace.id),
  ]);

  if (!shipment) {
    notFound();
  }

  const item = Array.isArray(shipment.shipment_items) ? shipment.shipment_items[0] : shipment.shipment_items;
  const transport = Array.isArray(shipment.shipment_transport) ? shipment.shipment_transport[0] : shipment.shipment_transport;
  const packageRow = Array.isArray(shipment.shipment_packages) ? shipment.shipment_packages[0] : shipment.shipment_packages;
  const destination = Array.isArray(shipment.businesses) ? shipment.businesses[0] : shipment.businesses;
  const site = Array.isArray(shipment.business_sites) ? shipment.business_sites[0] : shipment.business_sites;
  const contact = Array.isArray(shipment.contacts) ? shipment.contacts[0] : shipment.contacts;
  const carrier = Array.isArray(shipment.carriers) ? shipment.carriers[0] : shipment.carriers;
  const productCustoms =
    shipment.destination_country === "US" && item?.product_id ? await getProductCustomsForProduct(workspace.id, item.product_id) : null;
  const updateDestinationAction = updateShipmentDestination.bind(null, locale);
  const updateGoodsAndPackageAction = updateShipmentGoodsAndPackage.bind(null, locale);
  const updateTransportReferencesAction = updateShipmentTransportReferences.bind(null, locale);
  const updateStatusAction = updateShipmentStatus.bind(null, locale);
  const duplicateShipmentAction = duplicateShipmentDraft.bind(null, locale);
  const generatePackingSlipAction = generatePackingSlipDraft.bind(null, locale);
  const canMarkReady = Boolean(destination && site && contact && item?.quantity_confirmed && item.weight_confirmed && carrier && packageRow);
  const canGenerateDocuments = shipment.status === "ready";
  const hasValidatedHts = productCustoms?.validation_status === "validated";
  const hasGeneratedDocuments = generatedDocuments.length > 0;
  const destinationSummary = destination
    ? [destination.name, site?.city, site?.region].filter(Boolean).join(" · ")
    : "Destination à compléter";
  const goodsSummary = item ? `${item.name} · ${item.quantity} unité${item.quantity > 1 ? "s" : ""} · ${item.weight} ${item.weight_unit}` : "Marchandise à compléter";
  const transportSummary = carrier ? `${carrier.name}${transport?.pro_number ? ` · PRO ${transport.pro_number}` : ""}` : "Transporteur à compléter";

  return (
    <>
      <Link className="mb-6 inline-flex items-center gap-2 text-base font-semibold text-neutral-700" href={`/${locale}/shipments`}>
        <ArrowLeft aria-hidden="true" size={20} />
        Retour
      </Link>
      <PageHeader title={shipment.reference} description="Vérifier le brouillon avant toute génération de document." />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <ShipmentSectionCards
        actions={{
          duplicateShipment: duplicateShipmentAction,
          generatePackingSlip: generatePackingSlipAction,
          updateDestination: updateDestinationAction,
          updateGoodsAndPackage: updateGoodsAndPackageAction,
          updateStatus: updateStatusAction,
          updateTransport: updateTransportReferencesAction,
        }}
        businesses={businesses}
        carriers={carriers}
        documents={generatedDocuments}
        locale={locale}
        products={products}
        shipment={{
          carrierId: shipment.carrier_id,
          destinationBusinessId: shipment.destination_business_id,
          destinationContactId: shipment.destination_contact_id,
          destinationCountry: shipment.destination_country,
          destinationSiteId: shipment.destination_site_id,
          id: shipment.id,
          reason: shipment.reason,
          reference: shipment.reference,
          shipmentDate: shipment.shipment_date,
          status: shipment.status,
        }}
        shipmentItem={item}
        shipmentPackage={packageRow}
        state={{
          canGenerateDocuments,
          canMarkReady,
          hasGeneratedDocuments,
          htsCode: productCustoms?.hts_code,
          htsLabel: getHtsStatusLabel(productCustoms?.validation_status),
          htsValidated: hasValidatedHts,
        }}
        summaries={{ destination: destinationSummary, goods: goodsSummary, transport: transportSummary }}
        transport={transport}
      />
    </>
  );
}
