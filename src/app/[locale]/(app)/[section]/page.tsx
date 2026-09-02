import { notFound } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/i18n/dictionaries";

const sections = ["shipments", "products", "companies", "carriers", "brokers", "documents", "team", "settings"] as const;

type Section = (typeof sections)[number];

function isSection(value: string): value is Section {
  return sections.includes(value as Section);
}

type SectionPageProps = {
  params: Promise<{ locale: Locale; section: string }>;
};

export default async function SectionPage({ params }: SectionPageProps) {
  const { locale, section } = await params;

  if (!isSection(section)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const page = dictionary.pages[section];

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <section className="rounded-[24px] border border-dashed border-[var(--line)] bg-white p-8">
        <p className="text-lg leading-7 text-[var(--muted)]">{page.description}</p>
      </section>
    </>
  );
}
