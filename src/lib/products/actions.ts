"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { PackageType } from "@/lib/supabase/types";
import { demoProducts } from "@/lib/demo/products";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = readField(formData, key);
  if (!value) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function readPackageType(formData: FormData): PackageType {
  const value = readField(formData, "defaultPackageType");
  const allowed: PackageType[] = ["pallet", "box", "crate", "bundle", "drum", "other"];
  return allowed.includes(value as PackageType) ? (value as PackageType) : "pallet";
}

export async function createProduct(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/products?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const name = readField(formData, "name");

  if (!name) {
    redirect(`/${locale}/products?message=${encodeURIComponent("Le nom du produit est requis.")}`);
  }

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      workspace_id: workspace.id,
      name,
      part_number: readField(formData, "partNumber") || null,
      description_fr: readField(formData, "descriptionFr") || null,
      weight: readNumber(formData, "weight"),
      length: readNumber(formData, "length"),
      width: readNumber(formData, "width"),
      height: readNumber(formData, "height"),
      default_package_type: readPackageType(formData),
      stackable: formData.get("stackable") === "on",
      notes: readField(formData, "notes") || null,
    })
    .select("id")
    .single();

  if (error) {
    logServerError({ action: "create_product", error });
    redirect(`/${locale}/products?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "product_created",
    metadata_json: { productId: product.id },
  });

  revalidatePath(`/${locale}/products`);
  redirect(`/${locale}/products?message=${encodeURIComponent("Produit ajouté.")}`);
}

export async function seedDemoProducts(locale: Locale) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/products?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const supabase = await createClient();
  let insertedCount = 0;

  for (const product of demoProducts) {
    const { data: existing, error: lookupError } = await supabase
      .from("products")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("part_number", product.partNumber)
      .maybeSingle();

    if (lookupError) {
      logServerError({ action: "seed_demo_products_lookup", error: lookupError });
      redirect(`/${locale}/products?message=${encodeURIComponent(genericActionError(locale))}`);
    }

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("products").insert({
      workspace_id: workspace.id,
      name: product.name,
      part_number: product.partNumber,
      description_fr: product.descriptionFr,
      description_en: product.descriptionEn,
      weight: product.weight,
      weight_unit: product.weightUnit,
      length: product.length,
      width: product.width,
      height: product.height,
      dimension_unit: product.dimensionUnit,
      default_package_type: product.packageType,
      stackable: product.stackable,
      default_value: product.defaultValue,
      currency: product.currency,
      notes: product.notes,
    });

    if (error) {
      logServerError({ action: "seed_demo_products_insert", error });
      redirect(`/${locale}/products?message=${encodeURIComponent(genericActionError(locale))}`);
    }

    insertedCount += 1;
  }

  revalidatePath(`/${locale}/products`);
  if (insertedCount > 0) {
    await supabase.from("shipment_audit_log").insert({
      workspace_id: workspace.id,
      actor_user_id: user.id,
      action: "demo_products_seeded",
      metadata_json: { insertedCount },
    });
  }
  const message = insertedCount > 0 ? `${insertedCount} produits de démonstration ajoutés.` : "Les produits de démonstration sont déjà présents.";
  redirect(`/${locale}/products?message=${encodeURIComponent(message)}`);
}
