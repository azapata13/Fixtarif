"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { PackageType } from "@/lib/supabase/types";
import { demoProducts } from "@/lib/demo/products";
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
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
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
  const { error } = await supabase.from("products").insert({
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
  });

  if (error) {
    redirect(`/${locale}/products?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/products`);
  redirect(`/${locale}/products?message=${encodeURIComponent("Produit ajouté.")}`);
}

export async function seedDemoProducts(locale: Locale) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
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
      redirect(`/${locale}/products?message=${encodeURIComponent(lookupError.message)}`);
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
      redirect(`/${locale}/products?message=${encodeURIComponent(error.message)}`);
    }

    insertedCount += 1;
  }

  revalidatePath(`/${locale}/products`);
  const message = insertedCount > 0 ? `${insertedCount} produits de démonstration ajoutés.` : "Les produits de démonstration sont déjà présents.";
  redirect(`/${locale}/products?message=${encodeURIComponent(message)}`);
}
