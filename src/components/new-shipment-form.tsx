"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, ClipboardCheck, Plus, Search, X, XCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { getBusinessesForWorkspace } from "@/lib/businesses/queries";
import type { getCarriersForWorkspace } from "@/lib/carriers/queries";
import type { getProductCustomsForWorkspace } from "@/lib/customs/queries";
import type { getProductsForWorkspace } from "@/lib/products/queries";

type BusinessOption = Awaited<ReturnType<typeof getBusinessesForWorkspace>>[number];
type CarrierOption = Awaited<ReturnType<typeof getCarriersForWorkspace>>[number];
type ProductCustomsOption = Awaited<ReturnType<typeof getProductCustomsForWorkspace>>[number];
type ProductOption = Awaited<ReturnType<typeof getProductsForWorkspace>>[number];

type NewShipmentFormProps = {
  action: (formData: FormData) => void;
  businesses: BusinessOption[];
  carriers: CarrierOption[];
  locale: Locale;
  nextReference: string;
  productCustomsRows: ProductCustomsOption[];
  products: ProductOption[];
};

function getHtsStatusLabel(status?: string | null) {
  if (status === "validated") {
    return "Code douanier USA validé";
  }
  if (status === "rejected") {
    return "Code douanier USA rejeté";
  }
  if (status === "needs_review") {
    return "Code douanier USA à vérifier";
  }
  return "Code douanier USA manquant";
}

function getHtsStatusIcon(status?: string | null) {
  if (status === "validated") {
    return <CheckCircle2 aria-hidden="true" size={20} />;
  }
  if (status === "rejected") {
    return <XCircle aria-hidden="true" size={20} />;
  }
  if (status === "needs_review") {
    return <AlertCircle aria-hidden="true" size={20} />;
  }
  return <Circle aria-hidden="true" size={20} />;
}

type SearchModal = "business" | "site" | "contact" | "carrier" | "product" | null;

function LibraryLink({ children, href }: { children: string; href: string }) {
  return (
    <Link className="secondary-button !min-h-11 !px-4 !py-2 !text-sm" href={href}>
      <Plus aria-hidden="true" size={16} />
      {children}
    </Link>
  );
}

function SearchButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="secondary-button !min-h-11 !px-4 !py-2 !text-sm" onClick={onClick} type="button">
      <Search aria-hidden="true" size={16} />
      {children}
    </button>
  );
}

function searchableText(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

export function NewShipmentForm({ action, businesses, carriers, locale, nextReference, productCustomsRows, products }: NewShipmentFormProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [manualWeightUnit, setManualWeightUnit] = useState<"lb" | "kg">("lb");
  const [openModal, setOpenModal] = useState<SearchModal>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId), [products, selectedProductId]);
  const selectedProductCustoms = useMemo(
    () => productCustomsRows.find((customsRow) => customsRow.product_id === selectedProductId && customsRow.destination_country === "US"),
    [productCustomsRows, selectedProductId],
  );
  const selectedCarrier = useMemo(() => carriers.find((carrier) => carrier.id === selectedCarrierId), [carriers, selectedCarrierId]);
  const selectedBusiness = useMemo(() => businesses.find((business) => business.id === selectedBusinessId), [businesses, selectedBusinessId]);
  const businessSites = useMemo(() => (Array.isArray(selectedBusiness?.business_sites) ? selectedBusiness.business_sites : []), [selectedBusiness]);
  const businessContacts = useMemo(() => (Array.isArray(selectedBusiness?.contacts) ? selectedBusiness.contacts : []), [selectedBusiness]);
  const weightUnit = selectedProduct?.weight_unit ?? manualWeightUnit;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((business) =>
        searchableText([business.name, business.email, business.phone, business.notes]).includes(normalizedSearchTerm),
      ),
    [businesses, normalizedSearchTerm],
  );
  const filteredSites = useMemo(
    () =>
      businessSites.filter((site) =>
        searchableText([site.name, site.city, site.region, site.country, site.dock_info]).includes(normalizedSearchTerm),
      ),
    [businessSites, normalizedSearchTerm],
  );
  const filteredContacts = useMemo(
    () =>
      businessContacts.filter((contact) =>
        searchableText([contact.name, contact.email, contact.phone, contact.contact_type]).includes(normalizedSearchTerm),
      ),
    [businessContacts, normalizedSearchTerm],
  );
  const filteredCarriers = useMemo(
    () =>
      carriers.filter((carrier) =>
        searchableText([carrier.name, carrier.carrier_type, carrier.email, carrier.phone, carrier.notes]).includes(normalizedSearchTerm),
      ),
    [carriers, normalizedSearchTerm],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const customs = productCustomsRows.find((customsRow) => customsRow.product_id === product.id && customsRow.destination_country === "US");
        return searchableText([product.name, product.part_number, product.description_fr, product.description_en, product.notes, customs?.hts_code]).includes(normalizedSearchTerm);
      }),
    [products, productCustomsRows, normalizedSearchTerm],
  );

  function openSearchModal(modal: Exclude<SearchModal, null>) {
    setSearchTerm("");
    setOpenModal(modal);
  }

  function chooseBusiness(businessId: string) {
    setSelectedBusinessId(businessId);
    setSelectedSiteId("");
    setSelectedContactId("");
    setOpenModal(null);
  }

  function chooseProduct(productId: string) {
    setSelectedProductId(productId);
    setOpenModal(null);
  }

  return (
    <>
      <form action={action} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ClipboardCheck aria-hidden="true" size={24} />
          <h2 className="text-2xl font-semibold tracking-tight">Brouillon manuel</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-base font-semibold">
          Référence
          <input className="field" defaultValue={nextReference} name="reference" required />
        </label>
        <label className="block text-base font-semibold">
          Pays de destination
          <select className="field" name="destinationCountry" defaultValue="CA">
            <option value="CA">Canada</option>
            <option value="US">États-Unis</option>
          </select>
        </label>
        <label className="block text-base font-semibold">
          Motif
          <select className="field" name="reason" defaultValue="sale">
            <option value="sale">Vente</option>
            <option value="subcontracting">Sous-traitance</option>
            <option value="repair">Réparation</option>
            <option value="treatment">Traitement / peinture</option>
            <option value="return_rma">Retour / RMA</option>
            <option value="sample_test">Échantillon / test</option>
            <option value="loaned_material">Matériel prêté</option>
            <option value="tools_return">Outils à retourner</option>
            <option value="other">Autre</option>
          </select>
        </label>
        <section className="rounded-2xl border border-[var(--line)] bg-neutral-50 p-4 md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">Destination</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{selectedBusiness?.name ?? "Choisis un client ou crée-le dans la bibliothèque."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SearchButton onClick={() => openSearchModal("business")}>Rechercher client</SearchButton>
              <LibraryLink href={`/${locale}/companies`}>Créer client</LibraryLink>
            </div>
          </div>
          <select className="field" name="destinationBusinessId" value={selectedBusinessId} onChange={(event) => chooseBusiness(event.target.value)}>
            <option value="">À compléter</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </section>
        <label className="block text-base font-semibold">
          <span className="flex items-center justify-between gap-3">
            Site de livraison
            <SearchButton onClick={() => openSearchModal("site")}>Rechercher</SearchButton>
          </span>
          <select className="field" name="destinationSiteId" value={selectedSiteId} onChange={(event) => setSelectedSiteId(event.target.value)}>
            <option value="">Site à compléter</option>
            {businessSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} {site.city ? `- ${site.city}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-base font-semibold">
          <span className="flex items-center justify-between gap-3">
            Contact réception
            <SearchButton onClick={() => openSearchModal("contact")}>Rechercher</SearchButton>
          </span>
          <select className="field" name="destinationContactId" value={selectedContactId} onChange={(event) => setSelectedContactId(event.target.value)}>
            <option value="">Contact à compléter</option>
            {businessContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-base font-semibold">
          <span className="flex items-center justify-between gap-3">
            Transporteur
            <span className="flex flex-wrap gap-2">
              <SearchButton onClick={() => openSearchModal("carrier")}>Rechercher</SearchButton>
              <LibraryLink href={`/${locale}/carriers`}>Créer</LibraryLink>
            </span>
          </span>
          <select className="field" name="carrierId" value={selectedCarrierId} onChange={(event) => setSelectedCarrierId(event.target.value)}>
            <option value="">À compléter</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>
        </label>
        <section className="rounded-2xl border border-[var(--line)] bg-neutral-50 p-4 md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">Produit ou numéro de pièce</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {selectedProduct ? `${selectedProduct.name}${selectedProduct.part_number ? ` - ${selectedProduct.part_number}` : ""}` : "Recherche par nom, numéro de pièce ou code douanier USA."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SearchButton onClick={() => openSearchModal("product")}>Rechercher produit</SearchButton>
              <LibraryLink href={`/${locale}/products`}>Créer produit</LibraryLink>
            </div>
          </div>
          <select className="field" name="productId" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
            <option value="">Saisie manuelle</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </section>
        {selectedProduct ? (
          <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800">
            <p className="flex items-center gap-3">
              {getHtsStatusIcon(selectedProductCustoms?.validation_status)}
              {getHtsStatusLabel(selectedProductCustoms?.validation_status)}
            </p>
            {selectedProductCustoms?.hts_code ? <p className="mt-2 text-sm text-[var(--muted)]">{selectedProductCustoms.hts_code}</p> : null}
          </div>
        ) : null}
        <label className="block text-base font-semibold">
          Description de la marchandise
          <input className="field" defaultValue={selectedProduct?.name ?? ""} key={`name-${selectedProduct?.id ?? "manual"}`} name="productName" placeholder="ex: palette de supports machinés" required />
        </label>
        <label className="block text-base font-semibold">
          Numéro pièce
          <input className="field" defaultValue={selectedProduct?.part_number ?? ""} key={`part-${selectedProduct?.id ?? "manual"}`} name="partNumber" />
        </label>
        <label className="block text-base font-semibold">
          Lot
          <input className="field" name="lotNumber" />
        </label>
        <label className="block text-base font-semibold">
          Quantité estimée
          <input className="field" min="0.001" name="quantity" step="0.001" type="number" required />
        </label>
        <label className="block text-base font-semibold">
          Poids total estimé ({weightUnit})
          <input className="field" defaultValue={selectedProduct?.weight ?? ""} key={`weight-${selectedProduct?.id ?? "manual"}`} min="0.001" name="weight" step="0.001" type="number" required />
        </label>
        {selectedProduct ? (
          <input name="weightUnit" type="hidden" value={selectedProduct.weight_unit} />
        ) : (
          <label className="block text-base font-semibold">
            Unité poids
            <select className="field" name="weightUnit" value={manualWeightUnit} onChange={(event) => setManualWeightUnit(event.target.value === "kg" ? "kg" : "lb")}>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
        )}
        <input name="length" type="hidden" value={selectedProduct?.length ?? ""} />
        <input name="width" type="hidden" value={selectedProduct?.width ?? ""} />
        <input name="height" type="hidden" value={selectedProduct?.height ?? ""} />
        <input name="dimensionUnit" type="hidden" value={selectedProduct?.dimension_unit ?? "in"} />
        <input name="packageType" type="hidden" value={selectedProduct?.default_package_type ?? "pallet"} />
        <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base text-[var(--muted)] md:col-span-2">
          Une estimation suffit pour sauver le brouillon. Coche seulement lorsque la donnée est vérifiée.
        </p>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
          <input className="h-5 w-5 accent-black" name="quantityConfirmed" type="checkbox" />
          Quantité vérifiée
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
          <input className="h-5 w-5 accent-black" name="weightConfirmed" type="checkbox" />
          Poids vérifié
        </label>
        <label className="block text-base font-semibold">
          Nombre de colis/palettes
          <input className="field" defaultValue="1" min="1" name="packageCount" step="1" type="number" required />
        </label>
        <label className="block text-base font-semibold">
          Étiquette destination
          <input className="field" name="destinationLabel" placeholder={selectedBusiness?.name ?? "Destination"} />
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
          <input className="h-5 w-5 accent-black" defaultChecked={selectedProduct?.stackable ?? false} key={`stackable-${selectedProduct?.id ?? "manual"}`} name="stackable" type="checkbox" />
          Colis empilable
        </label>
        <label className="block text-base font-semibold">
          Paiement transport
          <select className="field" name="paymentTerm" defaultValue="prepaid">
            <option value="prepaid">Prépayé</option>
            <option value="collect">Collect</option>
            <option value="third_party">Tiers</option>
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
          <input className="h-5 w-5 accent-black" name="needsBol" type="checkbox" disabled={selectedCarrier?.default_provides_bol ?? false} />
          Besoin d&apos;un connaissement
        </label>
        {selectedCarrier?.default_provides_bol ? (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base text-[var(--muted)] md:col-span-2">
            Ce transporteur fournit généralement son propre connaissement.
          </p>
        ) : null}
        <label className="block text-base font-semibold md:col-span-2">
          Notes
          <textarea className="field min-h-28 resize-y" name="notes" />
        </label>
        </div>
        <button className="primary-button mt-6" type="submit">
          Créer le brouillon
        </button>
      </form>

      {openModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/35 px-4 py-6" role="presentation">
          <section aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--muted)]">Recherche rapide</p>
                <h3 className="mt-1 text-3xl font-semibold tracking-tight">
                  {openModal === "business" ? "Choisir un client" : null}
                  {openModal === "site" ? "Choisir un site" : null}
                  {openModal === "contact" ? "Choisir un contact" : null}
                  {openModal === "carrier" ? "Choisir un transporteur" : null}
                  {openModal === "product" ? "Trouver un produit" : null}
                </h3>
              </div>
              <button className="grid h-12 w-12 place-items-center rounded-full border border-[var(--line)]" onClick={() => setOpenModal(null)} type="button">
                <X aria-hidden="true" size={22} />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            <label className="mt-5 block text-base font-semibold">
              Rechercher
              <input
                autoFocus
                className="field"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={openModal === "product" ? "Nom, numéro de pièce, code douanier..." : "Nom, ville, courriel, téléphone..."}
                value={searchTerm}
              />
            </label>

            {openModal === "business" ? (
              <div className="mt-5 grid gap-3">
                <LibraryLink href={`/${locale}/companies`}>Créer un nouveau client</LibraryLink>
                {filteredBusinesses.map((business) => (
                  <button className="rounded-2xl bg-neutral-50 p-4 text-left transition hover:bg-neutral-100" key={business.id} onClick={() => chooseBusiness(business.id)} type="button">
                    <span className="block text-lg font-semibold text-neutral-950">{business.name}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{[business.email, business.phone].filter(Boolean).join(" · ") || "Client enregistré"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {openModal === "site" ? (
              <div className="mt-5 grid gap-3">
                {!selectedBusiness ? <p className="rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">Choisis d&apos;abord un client.</p> : null}
                <LibraryLink href={`/${locale}/companies`}>Ajouter un site</LibraryLink>
                {filteredSites.map((site) => (
                  <button className="rounded-2xl bg-neutral-50 p-4 text-left transition hover:bg-neutral-100" key={site.id} onClick={() => { setSelectedSiteId(site.id); setOpenModal(null); }} type="button">
                    <span className="block text-lg font-semibold text-neutral-950">{site.name}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{[site.city, site.region, site.country].filter(Boolean).join(", ") || "Site enregistré"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {openModal === "contact" ? (
              <div className="mt-5 grid gap-3">
                {!selectedBusiness ? <p className="rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">Choisis d&apos;abord un client.</p> : null}
                <LibraryLink href={`/${locale}/companies`}>Ajouter un contact</LibraryLink>
                {filteredContacts.map((contact) => (
                  <button className="rounded-2xl bg-neutral-50 p-4 text-left transition hover:bg-neutral-100" key={contact.id} onClick={() => { setSelectedContactId(contact.id); setOpenModal(null); }} type="button">
                    <span className="block text-lg font-semibold text-neutral-950">{contact.name}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{[contact.email, contact.phone, contact.contact_type].filter(Boolean).join(" · ") || "Contact enregistré"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {openModal === "carrier" ? (
              <div className="mt-5 grid gap-3">
                <LibraryLink href={`/${locale}/carriers`}>Créer un transporteur</LibraryLink>
                {filteredCarriers.map((carrier) => (
                  <button className="rounded-2xl bg-neutral-50 p-4 text-left transition hover:bg-neutral-100" key={carrier.id} onClick={() => { setSelectedCarrierId(carrier.id); setOpenModal(null); }} type="button">
                    <span className="block text-lg font-semibold text-neutral-950">{carrier.name}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{[carrier.carrier_type, carrier.email, carrier.phone].filter(Boolean).join(" · ") || "Transporteur enregistré"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {openModal === "product" ? (
              <div className="mt-5 grid gap-3">
                <LibraryLink href={`/${locale}/products`}>Créer un produit</LibraryLink>
                {filteredProducts.map((product) => {
                  const customs = productCustomsRows.find((customsRow) => customsRow.product_id === product.id && customsRow.destination_country === "US");
                  return (
                    <button className="rounded-2xl bg-neutral-50 p-4 text-left transition hover:bg-neutral-100" key={product.id} onClick={() => chooseProduct(product.id)} type="button">
                      <span className="block text-lg font-semibold text-neutral-950">{product.name}</span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        {[product.part_number ? `Pièce ${product.part_number}` : null, product.weight ? `${product.weight} ${product.weight_unit}` : null, customs?.hts_code ? `Code USA ${customs.hts_code}` : getHtsStatusLabel(customs?.validation_status)].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
