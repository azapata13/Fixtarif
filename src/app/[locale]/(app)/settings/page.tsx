import { Building2, Globe2, Mail, MapPin, Phone, ReceiptText, Ruler, Save, Scale } from "lucide-react";
import { type LocaleParams } from "@/app/[locale]/layout";
import { PageHeader } from "@/components/page-header";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { updateWorkspaceSettings } from "@/lib/workspaces/actions";
import { getCompanyProfileForWorkspace, getCurrentWorkspace } from "@/lib/workspaces/queries";

type SettingsPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { locale: localeParam } = await params;
  const { message } = await searchParams;
  const locale = localeParam as Locale;
  const dictionary = getDictionary(locale);
  const page = dictionary.pages.settings;
  const { workspace, membership } = await getCurrentWorkspace();
  const profile = workspace ? await getCompanyProfileForWorkspace(workspace.id) : null;
  const canManage = membership ? ["owner", "admin"].includes(membership.role) : false;
  const updateSettingsAction = updateWorkspaceSettings.bind(null, locale);

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {message ? <p className="mb-4 rounded-2xl bg-neutral-100 px-4 py-3 text-base text-neutral-700">{message}</p> : null}
      <form action={updateSettingsAction} className="grid gap-6 rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-sm">
        <section>
          <div className="flex items-center gap-3">
            <Building2 aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Entreprise</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-base font-semibold">
              Nom légal
              <input className="field" defaultValue={profile?.legal_name ?? ""} disabled={!canManage} name="legalName" required />
            </label>
            <label className="block text-base font-semibold">
              Nom commercial
              <input className="field" defaultValue={profile?.trade_name ?? ""} disabled={!canManage} name="tradeName" />
            </label>
            <label className="block text-base font-semibold md:col-span-2">
              <span className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" size={20} />
                Adresse
              </span>
              <input className="field" defaultValue={profile?.address ?? ""} disabled={!canManage} name="address" />
            </label>
            <label className="block text-base font-semibold">
              Ville
              <input className="field" defaultValue={profile?.city ?? ""} disabled={!canManage} name="city" />
            </label>
            <label className="block text-base font-semibold">
              Province / État
              <input className="field" defaultValue={profile?.region ?? ""} disabled={!canManage} name="region" />
            </label>
            <label className="block text-base font-semibold">
              Code postal / ZIP
              <input className="field" defaultValue={profile?.postal_code ?? ""} disabled={!canManage} name="postalCode" />
            </label>
            <label className="block text-base font-semibold">
              Pays
              <select className="field" defaultValue={profile?.country ?? "CA"} disabled={!canManage} name="country">
                <option value="CA">Canada</option>
                <option value="US">États-Unis</option>
              </select>
            </label>
            <label className="block text-base font-semibold">
              <span className="inline-flex items-center gap-2">
                <Phone aria-hidden="true" size={20} />
                Téléphone
              </span>
              <input className="field" defaultValue={profile?.phone ?? ""} disabled={!canManage} name="phone" />
            </label>
            <label className="block text-base font-semibold">
              <span className="inline-flex items-center gap-2">
                <Mail aria-hidden="true" size={20} />
                Courriel
              </span>
              <input className="field" defaultValue={profile?.email ?? ""} disabled={!canManage} name="email" type="email" />
            </label>
            <label className="block text-base font-semibold md:col-span-2">
              <span className="inline-flex items-center gap-2">
                <ReceiptText aria-hidden="true" size={20} />
                Numéro de taxe
              </span>
              <input className="field" defaultValue={profile?.tax_number ?? ""} disabled={!canManage} name="taxNumber" />
            </label>
          </div>
        </section>
        <section className="rounded-[24px] bg-neutral-50 p-5">
          <h2 className="text-2xl font-semibold tracking-tight">Workspace</h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{workspace?.name ?? "Fixtarif"}</p>
          <p className="mt-2 text-sm font-semibold uppercase text-[var(--muted)]">{membership?.role ?? "member"}</p>
        </section>
        <section>
          <div className="flex items-center gap-3">
            <Globe2 aria-hidden="true" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Langue du workspace</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-24 cursor-pointer items-center justify-between gap-4 rounded-[24px] border border-[var(--line)] bg-neutral-50 px-5 py-4 text-base font-semibold">
              <span>
                <span className="block text-xl text-neutral-950">Français</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">Interface et valeurs par défaut FR</span>
              </span>
              <input className="h-5 w-5 accent-black" defaultChecked={(profile?.language ?? locale) === "fr"} disabled={!canManage} name="language" type="radio" value="fr" />
            </label>
            <label className="flex min-h-24 cursor-pointer items-center justify-between gap-4 rounded-[24px] border border-[var(--line)] bg-neutral-50 px-5 py-4 text-base font-semibold">
              <span>
                <span className="block text-xl text-neutral-950">English</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">EN interface and defaults</span>
              </span>
              <input className="h-5 w-5 accent-black" defaultChecked={(profile?.language ?? locale) === "en"} disabled={!canManage} name="language" type="radio" value="en" />
            </label>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-base font-semibold">
            <span className="inline-flex items-center gap-2">
              <Scale aria-hidden="true" size={20} />
              Poids
            </span>
            <select className="field" defaultValue={profile?.weight_unit ?? "lb"} disabled={!canManage} name="weightUnit">
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
          <label className="block text-base font-semibold">
            <span className="inline-flex items-center gap-2">
              <Ruler aria-hidden="true" size={20} />
              Dimensions
            </span>
            <select className="field" defaultValue={profile?.dimension_unit ?? "in"} disabled={!canManage} name="dimensionUnit">
              <option value="in">in</option>
              <option value="cm">cm</option>
            </select>
          </label>
          <label className="block text-base font-semibold">
            Devise
            <select className="field" defaultValue={profile?.currency ?? "CAD"} disabled={!canManage} name="currency">
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="block text-base font-semibold">
            Format référence
            <input className="field" defaultValue={profile?.reference_format ?? "FXT-{YYYY}-{####}"} disabled={!canManage} name="referenceFormat" />
          </label>
        </section>
        {canManage ? (
          <button className="primary-button inline-flex items-center justify-center gap-2 justify-self-start" type="submit">
            <Save aria-hidden="true" size={20} />
            Enregistrer
          </button>
        ) : (
          <p className="mt-6 rounded-2xl bg-neutral-100 px-4 py-3 text-base font-semibold text-neutral-700">Lecture seule. Un rôle owner ou admin est requis.</p>
        )}
      </form>
    </>
  );
}
