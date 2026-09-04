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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" fill="#4285F4" />
      <path d="M12 22c2.7 0 5-0.9 6.7-2.4L15.5 17c-.9.6-2 .9-3.5.9a6 6 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.4 13.8A6 6 0 0 1 6 12c0-.6.1-1.2.4-1.8V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" fill="#FBBC05" />
      <path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6A6 6 0 0 1 12 6.1Z" fill="#EA4335" />
    </svg>
  );
}

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
        <Image alt="Fixtarif" height={42} priority src="/brand/fixtarif-logo.png" width={160} />
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
        </form>
        <form action={signInWithGoogleAction} className="mt-3">
          <button className="secondary-button inline-flex w-full items-center justify-center gap-3" type="submit">
            <GoogleIcon />
            {dictionary.auth.signInWithGoogle}
          </button>
        </form>
      </section>
    </main>
  );
}
