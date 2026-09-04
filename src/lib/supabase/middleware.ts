import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/lib/env";
import { isRecoverableAuthSessionError, isSupabaseAuthCookieName } from "@/lib/supabase/auth-errors";
import type { Database } from "@/lib/supabase/types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const { supabaseUrl, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  try {
    const { error } = await supabase.auth.getUser();

    if (error && !isRecoverableAuthSessionError(error)) {
      throw error;
    }

    if (!error) {
      return response;
    }
  } catch (error) {
    if (!isRecoverableAuthSessionError(error)) {
      throw error;
    }
  }

  response = NextResponse.next({ request });
  request.cookies.getAll().forEach((cookie) => {
    if (isSupabaseAuthCookieName(cookie.name)) {
      response.cookies.delete(cookie.name);
    }
  });

  return response;
}
