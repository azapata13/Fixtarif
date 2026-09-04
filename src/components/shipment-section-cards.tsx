"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileUp, LockKeyhole, MapPin, PackageCheck, ShieldCheck, X } from "lucide-react";
import type { Locale } from "@/i18n/config";

type ShipmentSectionKey = "validation" | "destination" | "goods" | "documents" | "customs";

type ShipmentSection = {
  complete: boolean;
  details: string[];
  href?: string;
  key: ShipmentSectionKey;
  summary: string;
  title: string;
};

type ShipmentSectionCardsProps = {
  locale: Locale;
  sections: ShipmentSection[];
};

const iconBySection = {
  customs: ShieldCheck,
  destination: MapPin,
  documents: FileUp,
  goods: PackageCheck,
  validation: CheckCircle2,
} satisfies Record<ShipmentSectionKey, typeof CheckCircle2>;

export function ShipmentSectionCards({ locale, sections }: ShipmentSectionCardsProps) {
  const [openSection, setOpenSection] = useState<ShipmentSection | null>(null);
  const OpenIcon = openSection ? iconBySection[openSection.key] : CheckCircle2;

  return (
    <>
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => {
          const Icon = iconBySection[section.key];
          return (
            <button
              className="focus-ring rounded-[24px] border border-[var(--line)] bg-white p-5 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              key={section.key}
              onClick={() => setOpenSection(section)}
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <Icon aria-hidden="true" size={26} />
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">
                  {section.complete ? "OK" : "À faire"}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950">{section.title}</h2>
              <p className="mt-2 text-base leading-6 text-[var(--muted)]">{section.summary}</p>
            </button>
          );
        })}
      </section>

      {openSection ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6" role="presentation">
          <section
            aria-modal="true"
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <OpenIcon aria-hidden="true" size={28} />
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">{openSection.title}</h2>
                </div>
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">{openSection.summary}</p>
              </div>
              <button
                aria-label="Fermer"
                className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-900 transition hover:bg-neutral-100"
                onClick={() => setOpenSection(null)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {openSection.details.map((detail) => (
                <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800" key={detail}>
                  {detail}
                </p>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {openSection.href ? (
                <Link className="primary-button inline-flex items-center gap-2" href={openSection.href} onClick={() => setOpenSection(null)}>
                  Ouvrir
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              ) : null}
              {openSection.key === "documents" ? (
                <Link className="secondary-button inline-flex items-center gap-2" href={`/${locale}/documents`} onClick={() => setOpenSection(null)}>
                  Importer un fichier
                  <FileUp aria-hidden="true" size={18} />
                </Link>
              ) : null}
              {openSection.key === "customs" ? (
                <p className="inline-flex min-h-12 items-center gap-2 rounded-full bg-neutral-100 px-5 py-3 text-base font-semibold text-neutral-700">
                  <LockKeyhole aria-hidden="true" size={18} />
                  Facture USA verrouillée
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
