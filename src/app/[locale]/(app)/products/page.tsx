import Link from "next/link";
import { AlertCircle, Box, CheckCircle2, Circle, CircleDollarSign, Landmark, PackagePlus, Ruler, Scale, Search, Sparkles, XCircle } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { refreshProductHtsRate, refreshWorkspaceHtsRates, saveProductHtsSuggestion, updateProductHtsValidation } from "@/lib/customs/actions";
import { searchHtsEntries } from "@/lib/customs/hts";
import { getProductCustomsForWorkspace } from "@/lib/customs/queries";
import { createProduct, seedDemoProducts } from "@/lib/products/actions";
import { getProductsForWorkspace } from "@/lib/products/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type ProductsPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ htsProductId?: string; htsQuery?: string; message?: string }>;
};

function getStatusLabel(status?: string | null) {
  if (status === "validated") {
    return "Validé";
  }
  if (status === "rejected") {
    return "Rejeté";
  }
  if (status === "needs_review") {
    return "À vérifier";
  }
  return "Manquant";
}

function getStatusIcon(status?: string | null) {
  if (status === "validated") {
    return <CheckCircle2 aria-hidden="true" size={19} />;
  }
  if (status === "rejected") {
    return <XCircle aria-hidden="true" size={19} />;
  }
  if (status === "needs_review") {
    return <AlertCircle aria-hidden="true" size={19} />;
  }
  return <Circle aria-hidden="true" size={19} />;
}

function buildSearchTerms(product: { name: string; part_number: string | null; description_fr: string | null }) {
  const descriptionWords = product.description_fr
    ?.split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9-]/g, ""))
    .filter((word) => word.length > 3)
    .slice(0, 3)
    .join(" ");

  return [product.name, product.part_number, descriptionWords].filter((term): term is string => Boolean(term));
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale: localeParam } = await params;
  const queryParams = await searchParams;
  const { message } = queryParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.products;
  const { workspace, membership } = await getCurrentWorkspace();
  const [products, customsRows] = workspace
    ? await Promise.all([getProductsForWorkspace(workspace.id), getProductCustomsForWorkspace(workspace.id)])
    : [[], []];
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const hasDemoProducts = products.some((product) => product.part_number === "ID-43567") && products.some((product) => product.part_number === "BR-1204");
  const createProductAction = createProduct.bind(null, locale);
  const seedDemoProductsAction = seedDemoProducts.bind(null, locale);
  const saveProductHtsSuggestionAction = saveProductHtsSuggestion.bind(null, locale);
  const updateProductHtsValidationAction = updateProductHtsValidation.bind(null, locale);
  const refreshProductHtsRateAction = refreshProductHtsRate.bind(null, locale);
  const refreshWorkspaceHtsRatesAction = refreshWorkspaceHtsRates.bind(null, locale);
  const selectedHtsProductId = products.some((product) => product.id === queryParams.htsProductId) ? queryParams.htsProductId : products[0]?.id;
  const selectedHtsProduct = products.find((product) => product.id === selectedHtsProductId);
  const htsQuery = queryParams.htsQuery?.trim() ?? "";
  const htsResults = htsQuery ? await searchHtsEntries(htsQuery) : [];
  const customsByProductId = new Map(customsRows.map((row) => [row.product_id, row]));
  const selectedSearchTerms = selectedHtsProduct ? buildSearchTerms(selectedHtsProduct) : [];

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      {canManage ? (
        <section className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <form action={createProductAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <PackagePlus aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Ajouter un produit</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold">
                Nom
                <input className="field" name="name" required />
              </label>
              <label className="block text-base font-semibold">
                Numéro de pièce
                <input className="field" name="partNumber" />
              </label>
              <label className="block text-base font-semibold md:col-span-2">
                Description FR
                <input className="field" name="descriptionFr" />
              </label>
              <label className="block text-base font-semibold">
                Poids par défaut
                <input className="field" min="0" name="weight" step="0.001" type="number" />
              </label>
              <label className="block text-base font-semibold">
                Emballage
                <select className="field" name="defaultPackageType" defaultValue="pallet">
                  <option value="pallet">Palette</option>
                  <option value="box">Boîte</option>
                  <option value="crate">Caisse</option>
                  <option value="bundle">Bundle</option>
                  <option value="drum">Baril</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label className="block text-base font-semibold">
                Longueur
                <input className="field" min="0" name="length" step="0.001" type="number" />
              </label>
              <label className="block text-base font-semibold">
                Largeur
                <input className="field" min="0" name="width" step="0.001" type="number" />
              </label>
              <label className="block text-base font-semibold">
                Hauteur
                <input className="field" min="0" name="height" step="0.001" type="number" />
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base font-semibold shadow-sm">
                <input className="h-5 w-5 accent-black" name="stackable" type="checkbox" />
                Empilable
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
          <form action={seedDemoProductsAction} className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" size={24} />
              <h2 className="text-2xl font-semibold tracking-tight">Données de test</h2>
            </div>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              Ajoute deux produits logistiques pour tester la bibliothèque. Aucune donnée HS/HTS ou CUSMA n&apos;est ajoutée.
            </p>
            {hasDemoProducts ? (
              <p className="mt-6 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">Produits de démonstration déjà ajoutés.</p>
            ) : (
              <button className="secondary-button mt-6" type="submit">
                Ajouter les deux produits
              </button>
            )}
          </form>
        </section>
      ) : null}
      {canManage ? (
        <section className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Landmark aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">HTS USA live</h2>
          </div>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            Recherche officielle USITC. Une sélection est enregistrée comme suggestion à vérifier, jamais comme classification validée automatiquement.
          </p>
          <form action={refreshWorkspaceHtsRatesAction} className="mt-5">
            <button className="secondary-button !min-h-11 !px-5 !py-2 !text-sm" disabled={!customsRows.length} type="submit">
              Revérifier tous les HTS enregistrés
            </button>
          </form>
          {selectedSearchTerms.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedSearchTerms.map((term) => (
                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                  href={`/${locale}/products?htsProductId=${selectedHtsProductId}&htsQuery=${encodeURIComponent(term)}`}
                  key={term}
                >
                  <Search aria-hidden="true" size={16} />
                  {term}
                </Link>
              ))}
            </div>
          ) : null}
          <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]" method="get">
            <label className="block text-base font-semibold">
              Produit
              <select className="field" defaultValue={selectedHtsProductId} name="htsProductId">
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.part_number ? `${product.part_number} - ${product.name}` : product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-base font-semibold">
              Code ou mot-clé
              <input className="field" defaultValue={htsQuery} name="htsQuery" placeholder="ex: bracket, 8302" />
            </label>
            <button className="primary-button self-end" disabled={!products.length} type="submit">
              Rechercher
            </button>
          </form>
          {htsQuery ? (
            <div className="mt-5 grid gap-3">
              {htsResults.length === 0 ? <p className="rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">Aucun résultat USITC trouvé.</p> : null}
              {htsResults.map((result) => (
                <form action={saveProductHtsSuggestionAction} className="rounded-2xl bg-neutral-50 p-4" key={`${result.htsno}-${result.description}`}>
                  <input name="productId" type="hidden" value={selectedHtsProductId ?? ""} />
                  <input name="htsno" type="hidden" value={result.htsno} />
                  <input name="description" type="hidden" value={result.description} />
                  <input name="generalRate" type="hidden" value={result.generalRate ?? ""} />
                  <input name="specialRate" type="hidden" value={result.specialRate ?? ""} />
                  <input name="otherRate" type="hidden" value={result.otherRate ?? ""} />
                  <input name="units" type="hidden" value={result.units.join("|")} />
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-lg font-semibold tracking-tight text-neutral-950">{result.htsno}</p>
                      <p className="mt-2 text-base leading-7 text-[var(--muted)]">{result.description}</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-700">
                        General: {result.generalRate ?? "n/a"} · Special: {result.specialRate ?? "n/a"} · Other: {result.otherRate ?? "n/a"}
                      </p>
                    </div>
                    <button className="secondary-button shrink-0" disabled={!selectedHtsProductId} type="submit">
                      Enregistrer à vérifier
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <p className="mb-4 text-base font-semibold text-[var(--muted)]">
        {products.length} produit{products.length > 1 ? "s" : ""}
      </p>
      <section className="grid gap-4 xl:grid-cols-2">
        {products.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
            <p className="text-lg leading-7 text-[var(--muted)]">Aucun produit dans ce workspace pour l&apos;instant.</p>
          </div>
        ) : null}
        {products.map((product) => {
          const customs = customsByProductId.get(product.id);
          const customsStatus = customs?.validation_status;
          const customsStatusLabel = getStatusLabel(customsStatus);

          return (
          <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={product.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{product.part_number ?? "Sans numéro"}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{product.name}</h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">{product.active ? "Actif" : "Inactif"}</span>
            </div>
            {product.description_fr ? <p className="mt-5 text-base leading-7 text-[var(--muted)]">{product.description_fr}</p> : null}
            <div className="mt-6 grid gap-3 text-base text-neutral-700 sm:grid-cols-2">
              <p className="flex items-center gap-3">
                <Scale aria-hidden="true" size={20} />
                {product.weight ? `${product.weight} ${product.weight_unit}` : "Poids à confirmer"}
              </p>
              <p className="flex items-center gap-3">
                <Box aria-hidden="true" size={20} />
                {product.default_package_type}
              </p>
              <p className="flex items-center gap-3">
                <Ruler aria-hidden="true" size={20} />
                {[product.length, product.width, product.height].every(Boolean)
                  ? `${product.length} x ${product.width} x ${product.height} ${product.dimension_unit}`
                  : "Dimensions à compléter"}
              </p>
              <p className="flex items-center gap-3">
                <CircleDollarSign aria-hidden="true" size={20} />
                {product.default_value ? `${product.default_value} ${product.currency}` : "Valeur non définie"}
              </p>
            </div>
            {product.notes ? <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-base leading-7 text-[var(--muted)]">{product.notes}</p> : null}
            <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {getStatusIcon(customsStatus)}
                  HTS USA - {customsStatusLabel}
                </p>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                  href={`/${locale}/products?htsProductId=${product.id}&htsQuery=${encodeURIComponent(product.part_number ?? product.name)}`}
                >
                  Chercher
                </Link>
              </div>
              {customs ? (
                <>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">{customs.hts_code}</p>
                  <p className="mt-2 text-base leading-7 text-[var(--muted)]">{customs.official_description}</p>
                  <p className="mt-2 text-sm font-semibold text-neutral-700">
                    General: {customs.general_rate ?? "n/a"} · Dernière consultation:{" "}
                    {customs.last_checked_at
                      ? new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium" }).format(new Date(customs.last_checked_at))
                      : "n/a"}
                  </p>
                  {customs.validated_at ? (
                    <p className="mt-2 text-sm font-semibold text-neutral-700">
                      Validé le{" "}
                      {new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium" }).format(new Date(customs.validated_at))}
                    </p>
                  ) : null}
                  {canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={refreshProductHtsRateAction}>
                        <input name="productCustomsId" type="hidden" value={customs.id} />
                        <button className="secondary-button !min-h-11 !px-4 !py-2 !text-sm" type="submit">
                          Revérifier USITC
                        </button>
                      </form>
                      {customs.validation_status !== "validated" ? (
                        <form action={updateProductHtsValidationAction}>
                          <input name="productCustomsId" type="hidden" value={customs.id} />
                          <input name="status" type="hidden" value="validated" />
                          <button className="primary-button !min-h-11 !px-4 !py-2 !text-sm" type="submit">
                            Valider HTS
                          </button>
                        </form>
                      ) : (
                        <form action={updateProductHtsValidationAction}>
                          <input name="productCustomsId" type="hidden" value={customs.id} />
                          <input name="status" type="hidden" value="needs_review" />
                          <button className="secondary-button !min-h-11 !px-4 !py-2 !text-sm" type="submit">
                            Remettre à vérifier
                          </button>
                        </form>
                      )}
                      {customs.validation_status !== "rejected" ? (
                        <form action={updateProductHtsValidationAction}>
                          <input name="productCustomsId" type="hidden" value={customs.id} />
                          <input name="status" type="hidden" value="rejected" />
                          <button className="secondary-button !min-h-11 !px-4 !py-2 !text-sm" type="submit">
                            Rejeter
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                  Aucun code HTS USA enregistré. Lance une recherche avec le nom, le numéro de pièce ou une description courte.
                </p>
              )}
            </div>
          </article>
          );
        })}
      </section>
    </>
  );
}
