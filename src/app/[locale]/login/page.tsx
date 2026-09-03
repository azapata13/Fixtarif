import { redirect } from "next/navigation";
import Image from "next/image";
import { type LocaleParams } from "@/app/[locale]/layout";
import { isSupabaseConfigured } from "@/lib/env";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { signIn, signInWithGoogle, signUp } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  params: LocaleParams;
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const { message } = await searchParams;
  const user = isSupabaseConfigured()
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  const dictionary = getDictionary(locale);
  const signInAction = signIn.bind(null, locale);
  const signUpAction = signUp.bind(null, locale);
  const signInWithGoogleAction = signInWithGoogle.bind(null, locale);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-lg rounded-[28px] border border-[var(--line)] bg-white p-8 shadow-sm sm:p-10">
        <Image alt="Fixtarif" className="h-auto w-40" height={80} priority src="/brand/fixtarif-logo.png" width={160} />
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">{dictionary.auth.title}</h1>
        <p className="mt-3 text-lg leading-7 text-[var(--muted)]">{dictionary.auth.subtitle}</p>
        {message || !isSupabaseConfigured() ? (
          <p className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-700">
            {message ?? "Supabase doit être configuré avant de tester l'authentification."}
          </p>
        ) : null}
        <form className="mt-8 space-y-5">
          <label className="block text-base font-semibold">
            {dictionary.auth.email}
            <input className="field" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="block text-base font-semibold">
            {dictionary.auth.password}
            <input
              className="field"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <button className="primary-button" formAction={signInAction}>
              {dictionary.auth.signIn}
            </button>
            <button className="secondary-button" formAction={signUpAction}>
              {dictionary.auth.signUp}
            </button>
          </div>
          <button className="secondary-button w-full" formAction={signInWithGoogleAction}>
            {dictionary.auth.signInWithGoogle}
          </button>
        </form>
      </section>
    </main>
  );
}
