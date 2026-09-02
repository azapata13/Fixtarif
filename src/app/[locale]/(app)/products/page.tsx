import { Box, CircleDollarSign, PackagePlus, Ruler, Scale, Sparkles } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createProduct, seedDemoProducts } from "@/lib/products/actions";
import { getProductsForWorkspace } from "@/lib/products/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type ProductsPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.products;
  const { workspace, membership } = await getCurrentWorkspace();
  const products = workspace ? await getProductsForWorkspace(workspace.id) : [];
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const hasDemoProducts = products.some((product) => product.part_number === "ID-43567") && products.some((product) => product.part_number === "BR-1204");
  const createProductAction = createProduct.bind(null, locale);
  const seedDemoProductsAction = seedDemoProducts.bind(null, locale);

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
      <p className="mb-4 text-base font-semibold text-[var(--muted)]">
        {products.length} produit{products.length > 1 ? "s" : ""}
      </p>
      <section className="grid gap-4 xl:grid-cols-2">
        {products.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
            <p className="text-lg leading-7 text-[var(--muted)]">Aucun produit dans ce workspace pour l&apos;instant.</p>
          </div>
        ) : null}
        {products.map((product) => (
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
          </article>
        ))}
      </section>
    </>
  );
}
