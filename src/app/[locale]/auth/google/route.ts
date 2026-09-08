import { NextResponse, type NextRequest } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { getAuthRedirectOrigin } from "@/lib/auth/origin";
import { isSupabaseConfigured } from "@/lib/env";
import { genericOAuthError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null, locale: Locale) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return `/${locale}/dashboard`;
  }

  return value;
}

function loginRedirect(locale: Locale, request: NextRequest, message: string) {
  const origin = getAuthRedirectOrigin(request);
  return NextResponse.redirect(new URL(`/${locale}/login?message=${encodeURIComponent(message)}`, origin));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "fr";

  if (!isSupabaseConfigured()) {
    return loginRedirect(locale, request, "Supabase is not configured yet.");
  }

  const origin = getAuthRedirectOrigin(request);
  const requestUrl = new URL(request.url);
  const next = safeNextPath(requestUrl.searchParams.get("next"), locale);
  const retry = requestUrl.searchParams.get("oauth_retry") === "1" ? "&oauth_retry=1" : "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}${retry}`,
    },
  });

  if (error || !data.url) {
    logServerError({ action: "google_oauth_route_start", error: error ?? new Error("Missing OAuth redirect URL") });
    return loginRedirect(locale, request, genericOAuthError(locale));
  }

  return NextResponse.redirect(data.url);
}
