import { NextResponse, type NextRequest } from "next/server";
import { genericOAuthError, logServerError } from "@/lib/security/public-errors";
import { getAuthRedirectOrigin } from "@/lib/auth/origin";
import { createClient } from "@/lib/supabase/server";
import { syncCurrentUserProfile } from "@/lib/users/profile";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/fr/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const redirectOrigin = getAuthRedirectOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/fr/login?message=Connexion%20Google%20annul%C3%A9e.", redirectOrigin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logServerError({ action: "google_oauth_callback", error });
    return NextResponse.redirect(new URL(`/fr/login?message=${encodeURIComponent(genericOAuthError("fr"))}`, redirectOrigin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncCurrentUserProfile(user);
  }

  return NextResponse.redirect(new URL(next, redirectOrigin));
}
