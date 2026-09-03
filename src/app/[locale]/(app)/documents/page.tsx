import { Bot, FileText, LockKeyhole, ScanLine, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { uploadSourceDocument } from "@/lib/documents/actions";
import { getDocumentOverviewForWorkspace } from "@/lib/documents/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type DocumentsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ message?: string }>;
};

const modules = [
  "Scan/import",
  "Packing slip",
  "BOL",
  "Facture commerciale USA",
  "HTS",
  "CUSMA",
];

export default async function DocumentsPage({ params, searchParams }: DocumentsPageProps) {
  const { locale } = await params;
  const { message } = await searchParams;
  const dictionary = getDictionary(locale);
  const { workspace } = await getCurrentWorkspace();
  const overview = workspace
    ? await getDocumentOverviewForWorkspace(workspace.id)
    : { generatedDocuments: [], schemaReady: false, sourceDocuments: [] };
  const page = dictionary.pages.documents;
  const uploadSourceDocumentAction = uploadSourceDocument.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description="Scan/import, PDF et douane USA préparés avec validation humaine avant automatisation." />
      {message ? <p className="mb-5 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">{message}</p> : null}

      {!overview.schemaReady ? (
        <p className="mb-5 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">
          Migration documents/douane à appliquer dans Supabase avant les uploads et PDF.
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ScanLine aria-hidden="true" size={26} />
            <h2 className="text-2xl font-semibold tracking-tight">Scan/import</h2>
          </div>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            Zone prête pour recevoir les fichiers source. Les buckets Supabase sont privés et chaque chemin sera isolé par workspace.
          </p>
          <form action={uploadSourceDocumentAction} className="mt-6 grid gap-4">
            <label className="block text-base font-semibold">
              Document source
              <input
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="field file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                disabled={!overview.schemaReady}
                name="sourceDocument"
                required
                type="file"
              />
            </label>
            <button className="primary-button justify-self-start" disabled={!overview.schemaReady} type="submit">
              <Upload aria-hidden="true" size={20} />
              Importer en privé
            </button>
          </form>
        </article>

        <article className="rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden="true" size={26} />
            <h2 className="text-2xl font-semibold tracking-tight">Sécurité documents</h2>
          </div>
          <ul className="mt-5 grid gap-3 text-base font-semibold text-neutral-800">
            <li className="rounded-2xl bg-neutral-50 px-4 py-3">Buckets privés source-documents et generated-documents</li>
            <li className="rounded-2xl bg-neutral-50 px-4 py-3">RLS par workspace sur les métadonnées</li>
            <li className="rounded-2xl bg-neutral-50 px-4 py-3">Validation humaine requise avant PDF/HTS/CUSMA</li>
          </ul>
        </article>
      </section>

      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ScanLine aria-hidden="true" size={26} />
          <h2 className="text-2xl font-semibold tracking-tight">Sources importées</h2>
        </div>
        {overview.sourceDocuments.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.sourceDocuments.map((document) => (
              <div key={document.id} className="rounded-2xl bg-neutral-50 p-4">
                <p className="break-words text-base font-semibold">{document.original_filename}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{document.validation_status}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{document.mime_type}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">
            Aucun document source importé. Les fichiers resteront privés dans Supabase Storage.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText aria-hidden="true" size={26} />
          <h2 className="text-2xl font-semibold tracking-tight">Documents générés</h2>
        </div>
        {overview.generatedDocuments.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.generatedDocuments.map((document) => (
              <div key={document.id} className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-base font-semibold">{document.document_type}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{document.validation_status}</p>
                <Link className="secondary-button mt-4 !min-h-11 !px-4 !py-2 !text-sm" href={`/${locale}/documents/${document.id}/download`} target="_blank">
                  Ouvrir PDF
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-neutral-50 p-4 text-base text-[var(--muted)]">
            Aucun PDF généré pour l&apos;instant. C&apos;est volontaire tant que les règles de validation ne sont pas verrouillées.
          </p>
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <article key={module} className="rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight">{module}</h3>
              <LockKeyhole aria-hidden="true" size={22} />
            </div>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">Préparé pour V2, bloqué jusqu&apos;à validation métier.</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Bot aria-hidden="true" size={26} />
          <h2 className="text-2xl font-semibold tracking-tight">Automatisation douanière USA</h2>
        </div>
        <p className="mt-3 text-base leading-7 text-[var(--muted)]">
          Prochaine étape: relier les produits aux codes HS/HTS, ajouter les champs de facture commerciale, puis générer des PDF après révision.
        </p>
      </section>
    </>
  );
}
