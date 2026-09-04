"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, FileUp, LockKeyhole, X } from "lucide-react";
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

export function ShipmentSectionCards({ locale, sections }: ShipmentSectionCardsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const openSection = sections[stepIndex];
  const completedCount = sections.filter((section) => section.complete).length;
  const progressPercent = Math.round((completedCount / sections.length) * 100);

  function openWizard(index: number) {
    setStepIndex(index);
    setIsOpen(true);
  }

  return (
    <>
      <section className="mb-6 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Étapes</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{completedCount}/{sections.length} complétées</p>
          </div>
          <button className="primary-button min-w-52" onClick={() => openWizard(0)} type="button">
            Commencer
          </button>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-black transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="mt-5 overflow-x-auto pb-2">
          <ol className="flex min-w-max items-center gap-0">
            {sections.map((section, index) => (
              <li className="flex items-center" key={section.key}>
                <button
                  className="focus-ring flex min-h-11 items-center gap-2 rounded-full px-2 pr-4 text-left text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                  onClick={() => openWizard(index)}
                  type="button"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 bg-white">
                    {section.complete ? <CheckCircle2 aria-hidden="true" size={18} /> : <Circle aria-hidden="true" size={14} />}
                  </span>
                  {section.title}
                </button>
                {index < sections.length - 1 ? <span className="mx-1 h-px w-9 bg-neutral-300" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {isOpen && openSection ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6" role="presentation">
          <section aria-modal="true" className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Étape {stepIndex + 1} de {sections.length}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{openSection.title}</h2>
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">{openSection.summary}</p>
              </div>
              <button
                aria-label="Fermer"
                className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-900 transition hover:bg-neutral-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {openSection.details.map((detail) => (
                <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-800" key={detail}>
                  {detail}
                </p>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {openSection.href ? (
                <Link className="secondary-button inline-flex items-center gap-2" href={openSection.href} onClick={() => setIsOpen(false)}>
                  Voir la section
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              ) : null}
              {openSection.key === "documents" ? (
                <Link className="secondary-button inline-flex items-center gap-2" href={`/${locale}/documents`} onClick={() => setIsOpen(false)}>
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

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
              <button
                className="secondary-button inline-flex gap-2"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                Retour
              </button>
              {stepIndex < sections.length - 1 ? (
                <button
                  className="primary-button inline-flex gap-2"
                  onClick={() => setStepIndex((current) => Math.min(sections.length - 1, current + 1))}
                  type="button"
                >
                  Suivant
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              ) : (
                <button className="primary-button" onClick={() => setIsOpen(false)} type="button">
                  Terminer
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
