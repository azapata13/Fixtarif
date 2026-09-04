import { redirect } from "next/navigation";
import Image from "next/image";
import { type LocaleParams } from "@/app/[locale]/layout";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createWorkspace } from "@/lib/workspaces/actions";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type OnboardingPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function OnboardingPage({ params, searchParams }: OnboardingPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const { message } = await searchParams;
  const { user, workspace } = await getCurrentWorkspace();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (workspace) {
    redirect(`/${locale}/dashboard`);
  }

  const dictionary = getDictionary(locale);
  const createWorkspaceAction = createWorkspace.bind(null, locale);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-xl rounded-[28px] border border-[var(--line)] bg-white p-8 shadow-sm sm:p-10">
        <Image alt="Fixtarif" height={42} priority src="/brand/fixtarif-logo.png" width={160} />
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">{dictionary.onboarding.title}</h1>
        {message ? (
          <p className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-700">{message}</p>
        ) : null}
        <form action={createWorkspaceAction} className="mt-8 grid gap-5">
          <label className="block text-base font-semibold">
            {dictionary.onboarding.name}
            <input className="field" name="workspaceName" required />
          </label>
          <label className="block text-base font-semibold">
            {dictionary.onboarding.legalName}
            <input className="field" name="legalName" required />
          </label>
          <button className="primary-button mt-2" type="submit">
            {dictionary.onboarding.create}
          </button>
        </form>
      </section>
    </main>
  );
}
