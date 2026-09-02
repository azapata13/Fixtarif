"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createWorkspace(locale: Locale, formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const workspaceName = field(formData, "workspaceName");
  const legalName = field(formData, "legalName");

  if (!workspaceName || !legalName) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent("Workspace and legal name are required.")}`);
  }

  const { data: workspaceId, error: workspaceError } = await supabase.rpc("create_workspace_with_owner", {
    workspace_name: workspaceName,
  });

  if (workspaceError || !workspaceId) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent(workspaceError?.message ?? "Workspace creation failed.")}`);
  }

  const { error: profileError } = await supabase.from("company_profiles").insert({
    workspace_id: workspaceId,
    legal_name: legalName,
    language: locale,
  });

  if (profileError) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent(profileError.message)}`);
  }

  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/dashboard`);
}

export async function updateWorkspaceSettings(locale: Locale, formData: FormData) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/settings?message=${encodeURIComponent("Permission requise.")}`);
  }

  const language = field(formData, "language");
  const nextLocale: Locale = language === "en" ? "en" : "fr";
  const weightUnit = field(formData, "weightUnit") === "kg" ? "kg" : "lb";
  const dimensionUnit = field(formData, "dimensionUnit") === "cm" ? "cm" : "in";
  const currency = field(formData, "currency") === "USD" ? "USD" : "CAD";

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_profiles")
    .update({
      language: nextLocale,
      weight_unit: weightUnit,
      dimension_unit: dimensionUnit,
      currency,
      reference_format: field(formData, "referenceFormat") || null,
    })
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/${locale}/settings?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${nextLocale}`, "layout");
  redirect(`/${nextLocale}/settings?message=${encodeURIComponent(nextLocale === "fr" ? "Réglages enregistrés." : "Settings saved.")}`);
}
