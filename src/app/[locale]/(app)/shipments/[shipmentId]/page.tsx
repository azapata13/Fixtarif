import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Circle, Copy, FileCheck2, LockKeyhole, MapPin, Scale, ShieldCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getProductCustomsForProduct } from "@/lib/customs/queries";
import { generatePackingSlipDraft } from "@/lib/documents/actions";
import { getGeneratedDocumentsForShipment } from "@/lib/documents/queries";
import { duplicateShipmentDraft, updateShipmentItemConfirmations, updateShipmentStatus, updateShipmentTransportReferences } from "@/lib/shipments/actions";
import { getShipmentForWorkspace } from "@/lib/shipments/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type ShipmentDetailPageProps = {
  params: Promise<{ locale: string; shipmentId: string }>;
  searchParams: Promise<{ message?: string }>;
};

function StatusRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800">
      {checked ? <CheckCircle2 aria-hidden="true" size={22} /> : <AlertCircle aria-hidden="true" size={22} />}
      {label}
    </li>
  );
}

function ProgressStep({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="flex items-center gap-3 text-base font-semibold text-neutral-900">
        {checked ? <CheckCircle2 aria-hidden="true" size={21} /> : <AlertCircle aria-hidden="true" size={21} />}
        {label}
      </p>
    </div>
  );
}

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

  const [shipment, generatedDocuments] = await Promise.all([
    getShipmentForWorkspace(workspace.id, shipmentId),
    getGeneratedDocumentsForShipment(workspace.id, shipmentId),
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
  const updateConfirmationsAction = updateShipmentItemConfirmations.bind(null, locale);
  const updateTransportReferencesAction = updateShipmentTransportReferences.bind(null, locale);
  const updateStatusAction = updateShipmentStatus.bind(null, locale);
  const duplicateShipmentAction = duplicateShipmentDraft.bind(null, locale);
  const generatePackingSlipAction = generatePackingSlipDraft.bind(null, locale);
  const canMarkReady = Boolean(destination && site && contact && item?.quantity_confirmed && item.weight_confirmed && carrier && packageRow);
  const canGenerateDocuments = shipment.status === "ready";
  const hasValidatedHts = productCustoms?.validation_status === "validated";
  const hasGeneratedDocuments = generatedDocuments.length > 0;
  const destinationCountryName = shipment.destination_country === "US" ? "États-Unis" : "Canada";
  const progressSteps = [
    Boolean(destination && site && contact),
    Boolean(item),
    Boolean(item?.quantity_confirmed && item?.weight_confirmed),
    Boolean(carrier && packageRow),
    shipment.status === "ready",
    hasGeneratedDocuments,
  ];
  const completedSteps = progressSteps.filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / progressSteps.length) * 100);

  return (
    <>
      <Link className="mb-6 inline-flex items-center gap-2 text-base font-semibold text-neutral-700" href={`/${locale}/shipments`}>
        <ArrowLeft aria-hidden="true" size={20} />
        Retour
      </Link>
      <PageHeader title={shipment.reference} description="Vérifier le brouillon avant toute génération de document." />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <section className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Progression</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{completedSteps}/{progressSteps.length} étapes complétées</h2>
          </div>
          <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">{progressPercent}%</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-black transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ProgressStep checked={Boolean(destination && site && contact)} label="Destination complète" />
          <ProgressStep checked={Boolean(item)} label="Produit ajouté" />
          <ProgressStep checked={Boolean(item?.quantity_confirmed && item?.weight_confirmed)} label="Quantité et poids confirmés" />
          <ProgressStep checked={Boolean(carrier && packageRow)} label="Transport et colis prêts" />
          <ProgressStep checked={shipment.status === "ready"} label="Expédition marquée prête" />
          <ProgressStep checked={hasGeneratedDocuments} label="PDF brouillon généré" />
        </div>
      </section>
      <form action={duplicateShipmentAction} className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm">
        <input name="shipmentId" type="hidden" value={shipment.id} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Expédition récurrente</h2>
            <p className="mt-1 text-base leading-7 text-[var(--muted)]">Duplique ce brouillon, puis confirme seulement le lot, la quantité et le poids.</p>
          </div>
          <button className="secondary-button inline-flex items-center justify-center gap-2" type="submit">
            <Copy aria-hidden="true" size={20} />
            Dupliquer
          </button>
        </div>
      </form>
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Validation</h2>
          <ul className="mt-5 grid gap-3">
            <StatusRow checked={Boolean(destination)} label={destination ? `Destination : ${destination.name}` : "Destination manquante"} />
            <StatusRow checked={Boolean(site)} label={site ? `Site : ${site.name}` : "Site à compléter"} />
            <StatusRow checked={Boolean(contact)} label={contact ? `Contact : ${contact.name}` : "Contact à compléter"} />
            <StatusRow checked={Boolean(item)} label={item ? `Produit : ${item.name}` : "Produit manquant"} />
            <StatusRow checked={Boolean(item?.quantity_confirmed)} label="Quantité confirmée" />
            <StatusRow checked={Boolean(item?.weight_confirmed)} label="Poids confirmé" />
            <StatusRow checked={Boolean(carrier)} label={carrier ? `Transporteur : ${carrier.name}` : "Transporteur à compléter"} />
            <StatusRow checked={Boolean(packageRow)} label={packageRow ? `Colis : ${packageRow.package_count} ${packageRow.package_type}` : "Colis / palettes à compléter"} />
          </ul>
          <form action={updateStatusAction} className="mt-6 grid gap-3">
            <input name="shipmentId" type="hidden" value={shipment.id} />
            <button className="secondary-button w-full" name="status" type="submit" value="validation">
              Passer en validation
            </button>
            <button className="primary-button w-full" disabled={!canMarkReady} name="status" type="submit" value="ready">
              Marquer prêt
            </button>
            <button className="secondary-button w-full" name="status" type="submit" value="archived">
              Archiver
            </button>
          </form>
        </aside>
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{shipment.status}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Expédition {destinationCountryName}</h2>
              <p className="mt-2 text-base text-[var(--muted)]">
                {shipment.reason} · {shipment.shipment_date}
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">{shipment.destination_country}</span>
          </div>
          {item ? (
            <form action={updateConfirmationsAction} className="mt-6">
              <input name="shipmentId" type="hidden" value={shipment.id} />
              <input name="itemId" type="hidden" value={item.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="flex items-center gap-3 text-base font-semibold">
                    <Truck aria-hidden="true" size={20} />
                    {item.name}
                  </p>
                  <p className="mt-2 text-base text-[var(--muted)]">{item.part_number ?? "Sans numéro de pièce"}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="flex items-center gap-3 text-base font-semibold">
                    <Scale aria-hidden="true" size={20} />
                    {item.weight} {item.weight_unit}
                  </p>
                  <p className="mt-2 text-base text-[var(--muted)]">Quantité : {item.quantity}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-base font-semibold">Emballage</p>
                  <p className="mt-2 text-base text-[var(--muted)]">{item.package_type}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-base font-semibold">Colis / palettes</p>
                  <p className="mt-2 text-base text-[var(--muted)]">
                    {packageRow ? `${packageRow.package_count} ${packageRow.package_type}` : "À compléter"}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-base font-semibold">Lot</p>
                  <p className="mt-2 text-base text-[var(--muted)]">{item.lot_number ?? "À compléter si requis"}</p>
                </div>
                <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                  <input className="h-5 w-5 accent-black" defaultChecked={item.quantity_confirmed} name="quantityConfirmed" type="checkbox" />
                  Quantité confirmée
                </label>
                <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                  <input className="h-5 w-5 accent-black" defaultChecked={item.weight_confirmed} name="weightConfirmed" type="checkbox" />
                  Poids confirmé
                </label>
              </div>
              <button className="primary-button mt-6" type="submit">
                Mettre à jour la validation
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">Aucune ligne produit.</p>
          )}
        </article>
      </section>
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPin aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Destination</h2>
          </div>
          <div className="mt-5 grid gap-3 text-base text-neutral-700">
            <p className="rounded-2xl bg-neutral-50 p-4">{destination?.name ?? "Client à compléter"}</p>
            <p className="rounded-2xl bg-neutral-50 p-4">
              {site ? [site.name, site.city, site.region, site.country].filter(Boolean).join(" · ") : "Site à compléter"}
            </p>
            <p className="rounded-2xl bg-neutral-50 p-4">
              {contact ? [contact.name, contact.email, contact.phone].filter(Boolean).join(" · ") : "Contact à compléter"}
            </p>
            {site?.dock_info ? <p className="rounded-2xl bg-neutral-50 p-4">Quai : {site.dock_info}</p> : null}
          </div>
        </article>
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileCheck2 aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Transport</h2>
          </div>
          {transport ? (
            <form action={updateTransportReferencesAction} className="mt-5 grid gap-4 md:grid-cols-2">
              <input name="shipmentId" type="hidden" value={shipment.id} />
              <input name="transportId" type="hidden" value={transport.id} />
              <label className="block text-base font-semibold">
                Numéro PRO
                <input className="field" defaultValue={transport.pro_number ?? ""} name="proNumber" />
              </label>
              <label className="block text-base font-semibold">
                Numéro BOL
                <input className="field" defaultValue={transport.bol_number ?? ""} name="bolNumber" />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm md:col-span-2">
                <input className="h-5 w-5 accent-black" defaultChecked={transport.needs_bol} name="needsBol" type="checkbox" />
                Connaissement requis
              </label>
              <p className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4 text-base text-neutral-700">
                <Circle aria-hidden="true" size={18} />
                Paiement : {transport.payment_term}
              </p>
              <button className="primary-button md:col-span-2" type="submit">
                Sauvegarder transport
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">Transport à compléter.</p>
          )}
        </article>
      </section>
      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileCheck2 aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
            </div>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              Génération PDF brouillon disponible seulement lorsque l&apos;expédition est prête. HTS/CUSMA restent verrouillés.
            </p>
          </div>
          <div className="grid gap-3">
            {canGenerateDocuments ? (
              <form action={generatePackingSlipAction}>
                <input name="shipmentId" type="hidden" value={shipment.id} />
                <button className="primary-button min-w-56" type="submit">
                  Générer packing slip
                </button>
              </form>
            ) : canMarkReady ? (
              <form action={updateStatusAction}>
                <input name="shipmentId" type="hidden" value={shipment.id} />
                <button className="primary-button min-w-56" name="status" type="submit" value="ready">
                  Marquer prêt pour générer
                </button>
              </form>
            ) : (
              <button className="primary-button min-w-56" disabled type="button">
                Générer packing slip
              </button>
            )}
            {!canMarkReady ? (
              <p className="max-w-64 text-sm leading-5 text-[var(--muted)]">
                Complète les cartes de progression, puis sauvegarde la validation.
              </p>
            ) : !canGenerateDocuments ? (
              <p className="max-w-64 text-sm leading-5 text-[var(--muted)]">Une dernière étape: marque l&apos;expédition prête.</p>
            ) : null}
          </div>
        </div>
        {generatedDocuments.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {generatedDocuments.map((document) => (
              <div key={document.id} className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-base font-semibold">{document.document_type}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{document.validation_status}</p>
                <Link className="secondary-button mt-4 !min-h-11 !px-4 !py-2 !text-sm" href={`/${locale}/documents/${document.id}/download`} target="_blank">
                  Ouvrir PDF
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">Aucun document généré pour cette expédition.</p>
        )}
      </section>
      {shipment.destination_country === "US" ? (
        <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Douane USA</h2>
          </div>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Les champs HTS, CUSMA, facture commerciale et courtier sont préparés dans la base. La facture commerciale reste bloquée tant que la douane USA
            n&apos;est pas complète et validée.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800">
              <p className="flex items-center gap-3">
                {hasValidatedHts ? <CheckCircle2 aria-hidden="true" size={19} /> : <LockKeyhole aria-hidden="true" size={19} />}
                {getHtsStatusLabel(productCustoms?.validation_status)}
              </p>
              {productCustoms?.hts_code ? <p className="mt-2 text-sm text-[var(--muted)]">{productCustoms.hts_code}</p> : null}
            </div>
            {["Origine à confirmer", "CUSMA verrouillé", "Facture commerciale bloquée"].map((label) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800">
                <LockKeyhole aria-hidden="true" size={19} />
                {label}
              </div>
            ))}
          </div>
          <Link className="secondary-button mt-5 inline-flex !min-h-11 !px-5 !py-2 !text-sm" href={`/${locale}/products`}>
            Valider les codes produits
          </Link>
        </section>
      ) : null}
    </>
  );
}
