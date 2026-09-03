"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/${locale}/login?message=${encodeURIComponent(error.message)}`);
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${locale}/dashboard`,
    },
  });

  if (error) {
    redirect(`/${locale}/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/onboarding`);
}

export async function signInWithGoogle(locale: Locale) {
  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/login?message=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/${locale}/dashboard`,
    },
  });

  if (error || !data.url) {
    redirect(`/${locale}/login?message=${encodeURIComponent(error?.message ?? "Google OAuth is not available yet.")}`);
  }

  redirect(data.url);
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
