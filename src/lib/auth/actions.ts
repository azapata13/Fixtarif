"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { genericAuthError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";
import { syncCurrentUserProfile } from "@/lib/users/profile";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(locale: Locale, formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/login?message=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logServerError({ action: "sign_in", error });
    redirect(`/${locale}/login?message=${encodeURIComponent(genericAuthError(locale))}`);
  }

  if (data.user) {
    await syncCurrentUserProfile(data.user);
  }

  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/dashboard`);
}

export async function signUp(locale: Locale, formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/login?message=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${locale}/dashboard`,
    },
  });

  if (error) {
    logServerError({ action: "sign_up", error });
    redirect(`/${locale}/login?message=${encodeURIComponent(genericAuthError(locale))}`);
  }

  if (data.user) {
    await syncCurrentUserProfile(data.user);
  }

  redirect(`/${locale}/onboarding`);
}

export async function signOut(locale: Locale) {
  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/login`);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/login`);
}
