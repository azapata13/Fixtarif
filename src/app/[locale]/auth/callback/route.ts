import { NextResponse, type NextRequest } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { getAuthRedirectOrigin } from "@/lib/auth/origin";
import { genericOAuthError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { syncCurrentUserProfile } from "@/lib/users/profile";

function safeNextPath(value: string | null, locale: Locale) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return `/${locale}/dashboard`;
  }

  return value;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "fr";
  const requestUrl = new URL(request.url);
  const redirectOrigin = getAuthRedirectOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"), locale);

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?message=Connexion%20Google%20annul%C3%A9e.`, redirectOrigin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logServerError({ action: "google_oauth_callback_localized", error });
    return NextResponse.redirect(new URL(`/${locale}/login?message=${encodeURIComponent(genericOAuthError(locale))}`, redirectOrigin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncCurrentUserProfile(user);
  }

  return NextResponse.redirect(new URL(next, redirectOrigin));
}
