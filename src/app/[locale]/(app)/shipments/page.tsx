import Link from "next/link";
import { AlertCircle, CheckCircle2, Plus, Scale, Truck } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getShipmentsForWorkspace } from "@/lib/shipments/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type ShipmentsPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function ShipmentsPage({ params, searchParams }: ShipmentsPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.shipments;
  const { workspace } = await getCurrentWorkspace();
  const shipments = workspace ? await getShipmentsForWorkspace(workspace.id) : [];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={page.title} description={page.description} />
        <Link className="primary-button inline-flex items-center justify-center gap-2" href={`/${locale}/shipments/new`}>
          <Plus aria-hidden="true" size={22} />
          Nouvelle expédition
        </Link>
      </div>
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <p className="mb-4 text-base font-semibold text-[var(--muted)]">
        {shipments.length} expédition{shipments.length > 1 ? "s" : ""}
      </p>
      <section className="grid gap-4">
        {shipments.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
            <p className="text-lg leading-7 text-[var(--muted)]">Aucune expédition pour l&apos;instant.</p>
          </div>
        ) : null}
        {shipments.map((shipment) => {
          const item = Array.isArray(shipment.shipment_items) ? shipment.shipment_items[0] : shipment.shipment_items;
          const quantityConfirmed = item?.quantity_confirmed ?? false;
          const weightConfirmed = item?.weight_confirmed ?? false;

          return (
            <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={shipment.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{shipment.status}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{shipment.reference}</h2>
                  <p className="mt-2 text-base text-[var(--muted)]">
                    {shipment.destination_country} · {shipment.reason} · {shipment.shipment_date}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">Brouillon</span>
              </div>
              {item ? (
                <div className="mt-6 grid gap-3 text-base text-neutral-700 md:grid-cols-3">
                  <p className="flex items-center gap-3">
                    <Truck aria-hidden="true" size={20} />
                    {item.name}
                  </p>
                  <p className="flex items-center gap-3">
                    {quantityConfirmed ? <CheckCircle2 aria-hidden="true" size={20} /> : <AlertCircle aria-hidden="true" size={20} />}
                    Quantité {item.quantity} {quantityConfirmed ? "confirmée" : "à confirmer"}
                  </p>
                  <p className="flex items-center gap-3">
                    <Scale aria-hidden="true" size={20} />
                    {item.weight} {item.weight_unit} {weightConfirmed ? "confirmé" : "à confirmer"}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </>
  );
}
