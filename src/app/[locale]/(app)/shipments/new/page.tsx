import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getBusinessesForWorkspace } from "@/lib/businesses/queries";
import { getCarriersForWorkspace } from "@/lib/carriers/queries";
import { getProductsForWorkspace } from "@/lib/products/queries";
import { createShipmentDraft } from "@/lib/shipments/actions";
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
  const createShipmentDraftAction = createShipmentDraft.bind(null, locale);

  return (
    <>
      <Link className="mb-6 inline-flex items-center gap-2 text-base font-semibold text-neutral-700" href={`/${locale}/shipments`}>
        <ArrowLeft aria-hidden="true" size={20} />
        Retour
      </Link>
      <PageHeader title="Nouvelle expédition Canada" description="Créer un brouillon manuel avec validation humaine de la quantité et du poids." />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <form action={createShipmentDraftAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ClipboardCheck aria-hidden="true" size={24} />
          <h2 className="text-2xl font-semibold tracking-tight">Brouillon manuel</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-base font-semibold">
            Référence
            <input className="field" name="reference" placeholder="ST-0001" required />
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
            <select className="field" name="carrierId" defaultValue="">
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
            <select className="field" name="productId" defaultValue="">
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
            <input className="field" name="productName" required />
          </label>
          <label className="block text-base font-semibold">
            Numéro pièce
            <input className="field" name="partNumber" />
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
            Poids total lb
            <input className="field" min="0.001" name="weight" step="0.001" type="number" required />
          </label>
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
            <input className="h-5 w-5 accent-black" name="needsBol" type="checkbox" />
            Besoin d&apos;un connaissement plus tard
          </label>
          <label className="block text-base font-semibold md:col-span-2">
            Notes
            <textarea className="field min-h-28 resize-y" name="notes" />
          </label>
        </div>
        <button className="primary-button mt-6" type="submit">
          Créer le brouillon
        </button>
      </form>
    </>
  );
}
