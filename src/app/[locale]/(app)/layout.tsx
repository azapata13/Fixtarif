import { redirect } from "next/navigation";
import { type LocaleParams } from "@/app/[locale]/layout";
import { AppShell } from "@/components/app-shell";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

export default async function PrivateLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: LocaleParams;
}>) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const { user, membership, workspace } = await getCurrentWorkspace();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell
      dictionary={dictionary}
      locale={locale}
      role={membership.role}
      userEmail={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
