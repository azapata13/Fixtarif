"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { getBusinessesForWorkspace } from "@/lib/businesses/queries";
import type { getCarriersForWorkspace } from "@/lib/carriers/queries";
import type { getProductsForWorkspace } from "@/lib/products/queries";

type BusinessOption = Awaited<ReturnType<typeof getBusinessesForWorkspace>>[number];
type CarrierOption = Awaited<ReturnType<typeof getCarriersForWorkspace>>[number];
type ProductOption = Awaited<ReturnType<typeof getProductsForWorkspace>>[number];

type NewShipmentFormProps = {
  action: (formData: FormData) => void;
  businesses: BusinessOption[];
  carriers: CarrierOption[];
  nextReference: string;
  products: ProductOption[];
};

export function NewShipmentForm({ action, businesses, carriers, nextReference, products }: NewShipmentFormProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId), [products, selectedProductId]);
  const selectedCarrier = useMemo(() => carriers.find((carrier) => carrier.id === selectedCarrierId), [carriers, selectedCarrierId]);

  return (
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
        <label className="block text-base font-semibold">
          Destination
          <select className="field" name="destinationBusinessId" defaultValue="">
            <option value="">À compléter</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-base font-semibold">
          Transporteur
          <select className="field" name="carrierId" value={selectedCarrierId} onChange={(event) => setSelectedCarrierId(event.target.value)}>
            <option value="">À compléter</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-base font-semibold">
          Produit enregistré
          <select className="field" name="productId" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
            <option value="">Saisie manuelle</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-base font-semibold">
          Nom produit
          <input className="field" defaultValue={selectedProduct?.name ?? ""} key={`name-${selectedProduct?.id ?? "manual"}`} name="productName" required />
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
          Quantité
          <input className="field" min="0.001" name="quantity" step="0.001" type="number" required />
        </label>
        <label className="block text-base font-semibold">
          Poids total {selectedProduct?.weight_unit ?? "lb"}
          <input className="field" defaultValue={selectedProduct?.weight ?? ""} key={`weight-${selectedProduct?.id ?? "manual"}`} min="0.001" name="weight" step="0.001" type="number" required />
        </label>
        <input name="weightUnit" type="hidden" value={selectedProduct?.weight_unit ?? "lb"} />
        <input name="length" type="hidden" value={selectedProduct?.length ?? ""} />
        <input name="width" type="hidden" value={selectedProduct?.width ?? ""} />
        <input name="height" type="hidden" value={selectedProduct?.height ?? ""} />
        <input name="dimensionUnit" type="hidden" value={selectedProduct?.dimension_unit ?? "in"} />
        <input name="packageType" type="hidden" value={selectedProduct?.default_package_type ?? "pallet"} />
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
          <input className="h-5 w-5 accent-black" name="quantityConfirmed" type="checkbox" />
          Quantité confirmée
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
          <input className="h-5 w-5 accent-black" name="weightConfirmed" type="checkbox" />
          Poids confirmé
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
          Besoin d&apos;un connaissement plus tard
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
  );
}
