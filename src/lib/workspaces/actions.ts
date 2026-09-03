"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
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
    logServerError({ action: "create_workspace", error: workspaceError ?? new Error("Missing workspace id") });
    redirect(`/${locale}/onboarding?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  const { error: profileError } = await supabase.from("company_profiles").insert({
    workspace_id: workspaceId,
    legal_name: legalName,
    language: locale,
  });

  if (profileError) {
    logServerError({ action: "create_company_profile", error: profileError });
    redirect(`/${locale}/onboarding?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/dashboard`);
}

export async function updateWorkspaceSettings(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
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
  const legalName = field(formData, "legalName");
  const country = field(formData, "country") === "US" ? "US" : "CA";
  const email = field(formData, "email");

  if (!legalName) {
    redirect(`/${locale}/settings?message=${encodeURIComponent("Le nom légal est requis.")}`);
  }

  if (email && !email.includes("@")) {
    redirect(`/${locale}/settings?message=${encodeURIComponent("Le courriel de l'entreprise est invalide.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_profiles")
    .update({
      legal_name: legalName,
      trade_name: field(formData, "tradeName") || null,
      address: field(formData, "address") || null,
      city: field(formData, "city") || null,
      region: field(formData, "region") || null,
      postal_code: field(formData, "postalCode") || null,
      country,
      phone: field(formData, "phone") || null,
      email: email || null,
      tax_number: field(formData, "taxNumber") || null,
      language: nextLocale,
      weight_unit: weightUnit,
      dimension_unit: dimensionUnit,
      currency,
      reference_format: field(formData, "referenceFormat") || null,
    })
    .eq("workspace_id", workspace.id);

  if (error) {
    logServerError({ action: "update_workspace_settings", error });
    redirect(`/${locale}/settings?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "workspace_settings_updated",
    metadata_json: { language: nextLocale, country, currency, weightUnit, dimensionUnit },
  });

  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${nextLocale}`, "layout");
  redirect(`/${nextLocale}/settings?message=${encodeURIComponent(nextLocale === "fr" ? "Réglages enregistrés." : "Settings saved.")}`);
}
