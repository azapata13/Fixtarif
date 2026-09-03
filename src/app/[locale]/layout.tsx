import { redirect } from "next/navigation";
import { defaultLocale, isLocale } from "@/i18n/config";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    redirect(`/${defaultLocale}/${locale}`);
  }

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}

export type LocaleParams = Promise<{ locale: string }>;
