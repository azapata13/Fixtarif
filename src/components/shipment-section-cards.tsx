"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, FileUp, LockKeyhole, X } from "lucide-react";
import type { Locale } from "@/i18n/config";

type Action = (formData: FormData) => void | Promise<void>;

type BusinessOption = {
  business_sites?: Array<{ id: string; name: string; city: string | null; region: string | null; country: string | null }>;
  contacts?: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
  id: string;
  name: string;
};

type ProductOption = {
  currency: string;
  default_package_type: string;
  default_value: number | null;
  description_fr: string | null;
  dimension_unit: "in" | "cm";
  height: number | null;
  id: string;
  length: number | null;
  name: string;
  part_number: string | null;
  stackable: boolean | null;
  weight: number | null;
  weight_unit: "lb" | "kg";
  width: number | null;
};

type CarrierOption = {
  default_provides_bol: boolean;
  id: string;
  name: string;
};

type GeneratedDocument = {
  document_type: string;
  id: string;
  validation_status: string;
};

type ShipmentWorkflowProps = {
  actions: {
    duplicateShipment: Action;
    generatePackingSlip: Action;
    uploadSourceDocument: Action;
    updateDestination: Action;
    updateGoodsAndPackage: Action;
    updateStatus: Action;
    updateTransport: Action;
  };
  businesses: BusinessOption[];
  carriers: CarrierOption[];
  documents: GeneratedDocument[];
  locale: Locale;
  products: ProductOption[];
  sourceDocuments: Array<{
    id: string;
    mime_type: string;
    original_filename: string;
    validation_status: string;
  }>;
  shipment: {
    carrierId: string | null;
    destinationBusinessId: string | null;
    destinationContactId: string | null;
    destinationCountry: "CA" | "US";
    destinationSiteId: string | null;
    id: string;
    reason: string;
    reference: string;
    shipmentDate: string;
    status: string;
  };
  state: {
    canGenerateDocuments: boolean;
    canMarkReady: boolean;
    hasGeneratedDocuments: boolean;
    htsCode?: string | null;
    htsLabel: string;
    htsValidated: boolean;
  };
  summaries: {
    destination: string;
    goods: string;
    transport: string;
  };
  shipmentItem?: {
    dimension_unit: "in" | "cm";
    height: number | null;
    id: string;
    length: number | null;
    lot_number: string | null;
    name: string;
    notes: string | null;
    package_type: string;
    part_number: string | null;
    product_id: string | null;
    quantity: number;
    quantity_confirmed: boolean;
    weight: number;
    weight_confirmed: boolean;
    weight_unit: "lb" | "kg";
    width: number | null;
  } | null;
  shipmentPackage?: {
    destination_label: string | null;
    dimension_unit: "in" | "cm";
    height: number | null;
    id: string;
    length: number | null;
    notes: string | null;
    package_count: number;
    package_type: string;
    stackable: boolean | null;
    weight: number | null;
    weight_unit: "lb" | "kg";
    width: number | null;
  } | null;
  transport?: {
    bol_number: string | null;
    carrier_id: string | null;
    id: string;
    needs_bol: boolean;
    payment_term: string;
    pro_number: string | null;
  } | null;
};

const packageTypes = ["pallet", "box", "crate", "bundle", "drum", "other"];
const paymentTerms = ["prepaid", "collect", "third_party"];

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block text-base font-semibold text-neutral-900">
      {label}
      {children}
    </label>
  );
}

function StepPill({ active, complete, label, onClick }: { active: boolean; complete: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`focus-ring flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-3 pr-5 text-left text-base font-semibold transition ${
        active ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className={`grid h-8 w-8 place-items-center rounded-full ${active ? "bg-white text-black" : "bg-neutral-50 text-neutral-900"}`}>
        {complete ? <CheckCircle2 aria-hidden="true" size={18} /> : <Circle aria-hidden="true" size={15} />}
      </span>
      {label}
    </button>
  );
}

function StatusLine({ checked, label }: { checked: boolean; label: string }) {
  return (
    <p className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800">
      {checked ? <CheckCircle2 aria-hidden="true" size={20} /> : <Circle aria-hidden="true" size={18} />}
      {label}
    </p>
  );
}

function ValidationLine({ checked, label, onFix }: { checked: boolean; label: string; onFix: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
      <p className="flex min-w-0 items-center gap-3 text-base font-semibold text-neutral-800">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
            checked ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"
          }`}
        >
          {checked ? <CheckCircle2 aria-hidden="true" size={18} /> : <Circle aria-hidden="true" size={15} />}
        </span>
        <span className="truncate">{label}</span>
      </p>
      {!checked ? (
        <button className="secondary-button !min-h-10 !px-4 !py-2 !text-sm" onClick={onFix} type="button">
          Corriger
        </button>
      ) : null}
    </div>
  );
}

export function ShipmentSectionCards({
  actions,
  businesses,
  carriers,
  documents,
  locale,
  products,
  shipment,
  shipmentItem,
  shipmentPackage,
  sourceDocuments,
  state,
  summaries,
  transport,
}: ShipmentWorkflowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedBusinessId, setSelectedBusinessId] = useState(shipment.destinationBusinessId ?? "");
  const [selectedProductId, setSelectedProductId] = useState(shipmentItem?.product_id ?? "");
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId);
  const selectedProduct = products.find((product) => product.id === selectedProductId);

  const steps = useMemo(
    () => [
      { complete: state.canMarkReady, key: "validation" as const, label: "Validation", summary: state.canMarkReady ? "Tout est prêt." : "Il reste des champs à corriger." },
      { complete: Boolean(shipment.destinationBusinessId && shipment.destinationSiteId && shipment.destinationContactId), key: "destination" as const, label: "Destination", summary: summaries.destination },
      { complete: Boolean(shipmentItem?.quantity_confirmed && shipmentItem.weight_confirmed), key: "goods" as const, label: "Marchandise", summary: summaries.goods },
      { complete: Boolean(shipment.carrierId && transport), key: "transport" as const, label: "Transport", summary: summaries.transport },
      { complete: state.hasGeneratedDocuments, key: "documents" as const, label: "Documents", summary: state.hasGeneratedDocuments ? "PDF brouillon disponible." : "Documents à générer." },
      ...(shipment.destinationCountry === "US"
        ? [{ complete: state.htsValidated, key: "customs" as const, label: "Douane USA", summary: state.htsValidated ? "HTS validé." : "HTS à valider." }]
        : []),
    ],
    [shipment, shipmentItem, state, summaries, transport],
  );

  const openStep = steps[stepIndex];
  const completedCount = steps.filter((step) => step.complete).length;
  const firstIncompleteStepIndex = steps.findIndex((step) => step.key !== "validation" && !step.complete);
  const preferredStartStepIndex = firstIncompleteStepIndex >= 0 ? firstIncompleteStepIndex : Math.min(1, steps.length - 1);

  function openWizard(index: number) {
    setStepIndex(index);
    setIsOpen(true);
  }

  function nextStep() {
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  return (
    <>
      <section className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Progression</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shipment.reference}</h2>
            <p className="mt-2 text-base leading-7 text-[var(--muted)]">
              {completedCount}/{steps.length} étapes complétées · {shipment.status.toUpperCase()} · {shipment.destinationCountry}
            </p>
          </div>
          <button className="primary-button min-w-56" onClick={() => openWizard(preferredStartStepIndex)} type="button">
            Modifier l&apos;expédition
          </button>
        </div>

        <div className="mt-5 overflow-x-auto pb-2">
          <ol className="flex min-w-max items-center gap-2">
            {steps.map((step, index) => (
              <li className="flex items-center gap-2" key={step.key}>
                <StepPill active={index === stepIndex && isOpen} complete={step.complete} label={step.label} onClick={() => openWizard(index)} />
                {index < steps.length - 1 ? <span className="hidden h-px w-10 bg-neutral-300 sm:block" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-3">
          <StatusLine checked={Boolean(shipment.destinationBusinessId)} label={summaries.destination} />
          <StatusLine checked={Boolean(shipmentItem)} label={summaries.goods} />
          <StatusLine checked={Boolean(shipment.carrierId)} label={summaries.transport} />
        </div>
      </section>

      <form action={actions.duplicateShipment} className="rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm">
        <input name="shipmentId" type="hidden" value={shipment.id} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Expédition récurrente</h2>
            <p className="mt-1 text-base leading-7 text-[var(--muted)]">Dupliquer ce brouillon pour une prochaine expédition semblable.</p>
          </div>
          <button className="secondary-button" type="submit">
            Dupliquer
          </button>
        </div>
      </form>

      {isOpen && openStep ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/35 px-4 py-6" role="presentation">
          <section aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Étape {stepIndex + 1} de {steps.length}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{openStep.label}</h2>
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">{openStep.summary}</p>
              </div>
              <button
                aria-label="Fermer"
                className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-900 transition hover:bg-neutral-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="mt-6">
              {openStep.key === "validation" ? (
                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ValidationLine
                      checked={Boolean(shipment.destinationBusinessId)}
                      label={`Destination: ${shipment.destinationBusinessId ? summaries.destination : "à choisir"}`}
                      onFix={() => setStepIndex(1)}
                    />
                    <ValidationLine
                      checked={Boolean(shipment.destinationSiteId && shipment.destinationContactId)}
                      label={shipment.destinationSiteId && shipment.destinationContactId ? `Réception: ${summaries.destination}` : "Site/contact: à choisir"}
                      onFix={() => setStepIndex(1)}
                    />
                    <ValidationLine checked={Boolean(shipmentItem)} label={`Produit: ${shipmentItem?.name ?? "à choisir"}`} onFix={() => setStepIndex(2)} />
                    <ValidationLine
                      checked={Boolean(shipmentItem?.quantity_confirmed)}
                      label={`Quantité: ${shipmentItem ? `${shipmentItem.quantity} ${shipmentItem.quantity_confirmed ? "confirmée" : "à confirmer"}` : "à compléter"}`}
                      onFix={() => setStepIndex(2)}
                    />
                    <ValidationLine
                      checked={Boolean(shipmentItem?.weight_confirmed)}
                      label={`Poids: ${shipmentItem ? `${shipmentItem.weight} ${shipmentItem.weight_unit} ${shipmentItem.weight_confirmed ? "confirmé" : "à confirmer"}` : "à compléter"}`}
                      onFix={() => setStepIndex(2)}
                    />
                    <ValidationLine
                      checked={Boolean(shipmentPackage)}
                      label={`Colis: ${shipmentPackage ? `${shipmentPackage.package_count} ${shipmentPackage.package_type}` : "à compléter"}`}
                      onFix={() => setStepIndex(2)}
                    />
                    <ValidationLine checked={Boolean(shipment.carrierId)} label={`Transporteur: ${summaries.transport}`} onFix={() => setStepIndex(3)} />
                    <ValidationLine checked={state.htsValidated || shipment.destinationCountry !== "US"} label={shipment.destinationCountry === "US" ? state.htsLabel : "Douane: Canada"} onFix={() => setStepIndex(5)} />
                  </div>
                  <form action={actions.updateStatus} className="mt-3 flex min-w-0 max-w-full flex-col gap-3 overflow-hidden sm:flex-row" style={{ maxWidth: "100%", minWidth: 0, width: "100%" }}>
                    <input name="shipmentId" type="hidden" value={shipment.id} />
                    <button className="secondary-button !w-full !min-w-0 !max-w-full" name="status" style={{ maxWidth: "100%", minWidth: 0, width: "100%" }} type="submit" value="validation">
                      En validation
                    </button>
                    <button className="primary-button !w-full !min-w-0 !max-w-full" disabled={!state.canMarkReady} name="status" style={{ maxWidth: "100%", minWidth: 0, width: "100%" }} type="submit" value="ready">
                      Marquer prêt
                    </button>
                    <button className="secondary-button !w-full !min-w-0 !max-w-full" name="status" style={{ maxWidth: "100%", minWidth: 0, width: "100%" }} type="submit" value="archived">
                      Archiver
                    </button>
                  </form>
                </div>
              ) : null}

              {openStep.key === "destination" ? (
                <form action={actions.updateDestination} className="grid gap-4">
                  <input name="shipmentId" type="hidden" value={shipment.id} />
                  <Field label="Client / destinataire">
                    <select className="field mt-2" name="destinationBusinessId" onChange={(event) => setSelectedBusinessId(event.target.value)} value={selectedBusinessId}>
                      <option value="">Choisir un client</option>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Site de livraison">
                    <select className="field mt-2" defaultValue={shipment.destinationSiteId ?? ""} key={`site-${selectedBusinessId}`} name="destinationSiteId">
                      <option value="">Choisir un site</option>
                      {(selectedBusiness?.business_sites ?? []).map((site) => (
                        <option key={site.id} value={site.id}>
                          {[site.name, site.city, site.region, site.country].filter(Boolean).join(" · ")}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Contact réception">
                    <select className="field mt-2" defaultValue={shipment.destinationContactId ?? ""} key={`contact-${selectedBusinessId}`} name="destinationContactId">
                      <option value="">Choisir un contact</option>
                      {(selectedBusiness?.contacts ?? []).map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {[contact.name, contact.email, contact.phone].filter(Boolean).join(" · ")}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Link className="secondary-button" href={`/${locale}/companies`}>
                    Ajouter un client, site ou contact
                  </Link>
                  <button className="primary-button" type="submit">
                    Sauvegarder destination
                  </button>
                </form>
              ) : null}

              {openStep.key === "goods" && shipmentItem ? (
                <form action={actions.updateGoodsAndPackage} className="grid gap-4">
                  <input name="shipmentId" type="hidden" value={shipment.id} />
                  <input name="itemId" type="hidden" value={shipmentItem.id} />
                  <input name="packageId" type="hidden" value={shipmentPackage?.id ?? ""} />
                  <Field label="Produit">
                    <select className="field mt-2" name="productId" onChange={(event) => setSelectedProductId(event.target.value)} value={selectedProductId}>
                      <option value="">Produit manuel</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Nom du produit">
                    <input className="field mt-2" defaultValue={selectedProduct?.name ?? shipmentItem.name} name="productName" />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Numéro de pièce">
                      <input className="field mt-2" defaultValue={selectedProduct?.part_number ?? shipmentItem.part_number ?? ""} name="partNumber" />
                    </Field>
                    <Field label="Lot">
                      <input className="field mt-2" defaultValue={shipmentItem.lot_number ?? ""} name="lotNumber" />
                    </Field>
                    <Field label="Quantité">
                      <input className="field mt-2" defaultValue={shipmentItem.quantity} min="0.001" name="quantity" step="0.001" type="number" />
                    </Field>
                    <Field label="Poids">
                      <div className="mt-2 grid grid-cols-[1fr_110px] gap-3">
                        <input className="field" defaultValue={selectedProduct?.weight ?? shipmentItem.weight} min="0.001" name="weight" step="0.001" type="number" />
                        <select className="field" defaultValue={selectedProduct?.weight_unit ?? shipmentItem.weight_unit} name="weightUnit">
                          <option value="lb">lb</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    </Field>
                    <Field label="Colis">
                      <input className="field mt-2" defaultValue={shipmentPackage?.package_count ?? 1} min="1" name="packageCount" step="1" type="number" />
                    </Field>
                    <Field label="Emballage">
                      <select className="field mt-2" defaultValue={selectedProduct?.default_package_type ?? shipmentItem.package_type} name="packageType">
                        {packageTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_110px]">
                    <Field label="Longueur">
                      <input className="field mt-2" defaultValue={selectedProduct?.length ?? shipmentItem.length ?? ""} min="0" name="length" step="0.001" type="number" />
                    </Field>
                    <Field label="Largeur">
                      <input className="field mt-2" defaultValue={selectedProduct?.width ?? shipmentItem.width ?? ""} min="0" name="width" step="0.001" type="number" />
                    </Field>
                    <Field label="Hauteur">
                      <input className="field mt-2" defaultValue={selectedProduct?.height ?? shipmentItem.height ?? ""} min="0" name="height" step="0.001" type="number" />
                    </Field>
                    <Field label="Unité">
                      <select className="field mt-2" defaultValue={selectedProduct?.dimension_unit ?? shipmentItem.dimension_unit} name="dimensionUnit">
                        <option value="in">in</option>
                        <option value="cm">cm</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Étiquette destination">
                    <input className="field mt-2" defaultValue={shipmentPackage?.destination_label ?? ""} name="destinationLabel" />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                      <input className="h-5 w-5 accent-black" defaultChecked={shipmentItem.quantity_confirmed} name="quantityConfirmed" type="checkbox" />
                      Quantité confirmée
                    </label>
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                      <input className="h-5 w-5 accent-black" defaultChecked={shipmentItem.weight_confirmed} name="weightConfirmed" type="checkbox" />
                      Poids confirmé
                    </label>
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                      <input className="h-5 w-5 accent-black" defaultChecked={Boolean(shipmentPackage?.stackable)} name="stackable" type="checkbox" />
                      Empilable
                    </label>
                  </div>
                  <button className="primary-button" type="submit">
                    Sauvegarder marchandise
                  </button>
                </form>
              ) : null}

              {openStep.key === "transport" && transport ? (
                <form action={actions.updateTransport} className="grid gap-4">
                  <input name="shipmentId" type="hidden" value={shipment.id} />
                  <input name="transportId" type="hidden" value={transport.id} />
                  <Field label="Transporteur">
                    <select className="field mt-2" defaultValue={transport.carrier_id ?? shipment.carrierId ?? ""} name="carrierId">
                      <option value="">Choisir un transporteur</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Numéro PRO">
                      <input className="field mt-2" defaultValue={transport.pro_number ?? ""} name="proNumber" />
                    </Field>
                    <Field label="Numéro BOL">
                      <input className="field mt-2" defaultValue={transport.bol_number ?? ""} name="bolNumber" />
                    </Field>
                  </div>
                  <Field label="Paiement transport">
                    <select className="field mt-2" defaultValue={transport.payment_term} name="paymentTerm">
                      {paymentTerms.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                    <input className="h-5 w-5 accent-black" defaultChecked={transport.needs_bol} name="needsBol" type="checkbox" />
                    Connaissement requis
                  </label>
                  <Link className="secondary-button" href={`/${locale}/carriers`}>
                    Ajouter un transporteur
                  </Link>
                  <button className="primary-button" type="submit">
                    Sauvegarder transport
                  </button>
                </form>
              ) : null}

              {openStep.key === "documents" ? (
                <div className="grid gap-4">
                  <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base text-neutral-700">
                    Le PDF brouillon reste privé. Ajoute ici les fichiers source liés à cette expédition; le scan intelligent restera soumis à une révision humaine.
                  </p>
                  <form action={actions.uploadSourceDocument} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <input name="shipmentId" type="hidden" value={shipment.id} />
                    <label className="block text-base font-semibold">
                      Fichier source
                      <input
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        className="field file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                        name="sourceDocument"
                        required
                        type="file"
                      />
                    </label>
                    <button className="primary-button mt-4" type="submit">
                      <FileUp aria-hidden="true" size={18} />
                      Ajouter le fichier
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-3">
                    <Link className="secondary-button inline-flex items-center gap-2" href={`/${locale}/documents`}>
                      <FileUp aria-hidden="true" size={18} />
                      Voir tous les documents
                    </Link>
                    {state.canGenerateDocuments ? (
                      <form action={actions.generatePackingSlip}>
                        <input name="shipmentId" type="hidden" value={shipment.id} />
                        <button className="primary-button" type="submit">
                          Générer packing slip
                        </button>
                      </form>
                    ) : state.canMarkReady ? (
                      <form action={actions.updateStatus}>
                        <input name="shipmentId" type="hidden" value={shipment.id} />
                        <button className="primary-button" name="status" type="submit" value="ready">
                          Marquer prêt
                        </button>
                      </form>
                    ) : (
                      <button className="primary-button" disabled type="button">
                        Générer packing slip
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">Fichiers source</h3>
                    {sourceDocuments.length ? (
                      sourceDocuments.map((document) => (
                        <div className="rounded-2xl bg-neutral-50 p-4" key={document.id}>
                          <p className="break-words text-base font-semibold">{document.original_filename}</p>
                          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{document.validation_status}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{document.mime_type}</p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base text-[var(--muted)]">Aucun fichier source lié.</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">PDF générés</h3>
                    {documents.length ? (
                      documents.map((document) => (
                        <div className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
                          <div>
                            <p className="text-base font-semibold">{document.document_type}</p>
                            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{document.validation_status}</p>
                          </div>
                          <Link className="secondary-button !min-h-11 !px-4 !py-2 !text-sm" href={`/${locale}/documents/${document.id}/download`} target="_blank">
                            Ouvrir PDF
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base text-[var(--muted)]">Aucun document généré.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {openStep.key === "customs" ? (
                <div className="grid gap-3">
                  <StatusLine checked={state.htsValidated} label={state.htsCode ? `${state.htsLabel}: ${state.htsCode}` : state.htsLabel} />
                  <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base text-neutral-700">
                    Origine, CUSMA et facture commerciale restent verrouillés pour le MVP afin d’éviter une déclaration douanière non validée.
                  </p>
                  <Link className="secondary-button" href={`/${locale}/products`}>
                    Valider les codes produits
                  </Link>
                  <p className="inline-flex min-h-12 items-center gap-2 rounded-full bg-neutral-100 px-5 py-3 text-base font-semibold text-neutral-700">
                    <LockKeyhole aria-hidden="true" size={18} />
                    Facture USA verrouillée
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
              <button
                className="secondary-button inline-flex gap-2"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                Retour
              </button>
              {stepIndex < steps.length - 1 ? (
                <button className="primary-button inline-flex gap-2" onClick={nextStep} type="button">
                  Suivant
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              ) : (
                <button className="primary-button" onClick={() => setIsOpen(false)} type="button">
                  Terminer
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
