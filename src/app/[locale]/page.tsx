import { redirect } from "next/navigation";
import { type LocaleParams } from "@/app/[locale]/layout";

export default async function LocaleHome({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
