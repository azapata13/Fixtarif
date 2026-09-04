"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function splitUnits(value: string) {
  return value
    .split("|")
    .map((unit) => unit.trim())
    .filter(Boolean);
}

export async function saveProductHtsSuggestion(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/products?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const productId = readField(formData, "productId");
  const htsno = readField(formData, "htsno");
  const description = readField(formData, "description");

  if (!productId || !htsno || !description) {
    redirect(`/${locale}/products?message=${encodeURIComponent("Suggestion HTS incomplète.")}`);
  }

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    if (productError) {
      logServerError({ action: "save_product_hts_product_lookup", error: productError });
    }
    redirect(`/${locale}/products?message=${encodeURIComponent(productError ? genericActionError(locale) : "Produit introuvable.")}`);
  }

  const { error } = await supabase.from("product_customs").upsert(
    {
      workspace_id: workspace.id,
      product_id: product.id,
      destination_country: "US",
      hts_code: htsno,
      official_description: description,
      general_rate: readField(formData, "generalRate") || null,
      special_rate: readField(formData, "specialRate") || null,
      other_rate: readField(formData, "otherRate") || null,
      units: splitUnits(readField(formData, "units")),
      source_name: "USITC HTS",
      last_checked_at: new Date().toISOString(),
      hts_result_json: {
        htsno,
        description,
        general: readField(formData, "generalRate") || null,
        special: readField(formData, "specialRate") || null,
        other: readField(formData, "otherRate") || null,
        units: splitUnits(readField(formData, "units")),
      },
      validation_status: "needs_review",
    },
    { onConflict: "workspace_id,product_id,destination_country" },
  );

  if (error) {
    logServerError({ action: "save_product_hts_suggestion", error });
    redirect(`/${locale}/products?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "product_hts_suggestion_saved",
    metadata_json: { productId: product.id, htsno, source: "USITC HTS" },
  });

  revalidatePath(`/${locale}/products`);
  redirect(`/${locale}/products?message=${encodeURIComponent("Suggestion HTS enregistrée. Validation humaine requise.")}`);
}
