import Link from "next/link";
import { ArrowRight, Building2, FileText, Package, Truck } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const quickLinks = [
  { key: "shipments", icon: Truck },
  { key: "products", icon: Package },
  { key: "companies", icon: Building2 },
  { key: "documents", icon: FileText },
] as const;

export default async function DashboardPage({ params }: { params: LocaleParams }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.dashboard;

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="focus-ring rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              href={`/${locale}/${item.key}`}
              key={item.key}
            >
              <div className="flex items-center justify-between gap-4">
                <Icon aria-hidden="true" className="text-neutral-950" size={28} />
                <ArrowRight aria-hidden="true" className="text-neutral-400" size={22} />
              </div>
              <h2 className="mt-6 text-xl font-semibold tracking-tight">{dictionary.nav[item.key]}</h2>
              <p className="mt-3 text-base leading-6 text-[var(--muted)]">{dictionary.pages[item.key].description}</p>
            </Link>
          );
        })}
      </section>
    </>
  );
}
