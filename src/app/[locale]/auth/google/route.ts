import { NextResponse, type NextRequest } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { getAuthRedirectOrigin } from "@/lib/auth/origin";
import { isSupabaseConfigured } from "@/lib/env";
import { genericOAuthError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/${locale}/auth/callback?next=/${locale}/dashboard`,
    },
  });

  if (error || !data.url) {
    logServerError({ action: "google_oauth_route_start", error: error ?? new Error("Missing OAuth redirect URL") });
    return loginRedirect(locale, request, genericOAuthError(locale));
  }

  return NextResponse.redirect(data.url);
}
