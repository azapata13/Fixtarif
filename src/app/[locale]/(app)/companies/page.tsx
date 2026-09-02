import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { demoClients } from "@/lib/demo/clients";

export default async function CompaniesPage({ params }: { params: LocaleParams }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.companies;

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <section className="grid gap-4 xl:grid-cols-2">
        {demoClients.map((client) => (
          <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm" key={client.name}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{client.role}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{client.name}</h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">Démo</span>
            </div>
            <div className="mt-6 grid gap-3 text-base text-neutral-700">
              <p className="flex items-center gap-3">
                <MapPin aria-hidden="true" size={20} />
                {client.city}, {client.region}
              </p>
              <p className="flex items-center gap-3">
                <UserRound aria-hidden="true" size={20} />
                {client.contact}
              </p>
              <p className="flex items-center gap-3">
                <Mail aria-hidden="true" size={20} />
                {client.email}
              </p>
              <p className="flex items-center gap-3">
                <Phone aria-hidden="true" size={20} />
                {client.phone}
              </p>
            </div>
            <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-base leading-7 text-[var(--muted)]">{client.notes}</p>
          </article>
        ))}
      </section>
    </>
  );
}
