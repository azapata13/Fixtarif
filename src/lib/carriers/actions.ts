"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { CarrierType } from "@/lib/supabase/types";
import { demoCarriers } from "@/lib/demo/carriers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readCarrierType(formData: FormData): CarrierType {
  const value = readField(formData, "carrierType");
  const allowed: CarrierType[] = ["ltl", "ftl", "flatbed", "parcel", "other"];
  return allowed.includes(value as CarrierType) ? (value as CarrierType) : "ltl";
}

async function requireManager(locale: Locale) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/carriers?message=${encodeURIComponent("Permission refusée.")}`);
  }

  return workspace;
}

export async function createCarrier(locale: Locale, formData: FormData) {
  const workspace = await requireManager(locale);
  const name = readField(formData, "name");

  if (!name) {
    redirect(`/${locale}/carriers?message=${encodeURIComponent("Le nom du transporteur est requis.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("carriers").insert({
    workspace_id: workspace.id,
    name,
    carrier_type: readCarrierType(formData),
    email: readField(formData, "email") || null,
    phone: readField(formData, "phone") || null,
    default_provides_bol: formData.get("defaultProvidesBol") === "on",
    notes: readField(formData, "notes") || null,
  });

  if (error) {
    redirect(`/${locale}/carriers?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/carriers`);
  redirect(`/${locale}/carriers?message=${encodeURIComponent("Transporteur ajouté.")}`);
}

export async function seedDemoCarriers(locale: Locale) {
  const workspace = await requireManager(locale);
  const supabase = await createClient();
  let insertedCount = 0;

  for (const carrier of demoCarriers) {
    const { data: existing, error: lookupError } = await supabase
      .from("carriers")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", carrier.name)
      .maybeSingle();

    if (lookupError) {
      redirect(`/${locale}/carriers?message=${encodeURIComponent(lookupError.message)}`);
    }

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("carriers").insert({
      workspace_id: workspace.id,
      name: carrier.name,
      carrier_type: carrier.carrierType,
      email: carrier.email,
      phone: carrier.phone,
      default_provides_bol: carrier.defaultProvidesBol,
      notes: carrier.notes,
    });

    if (error) {
      redirect(`/${locale}/carriers?message=${encodeURIComponent(error.message)}`);
    }

    insertedCount += 1;
  }

  revalidatePath(`/${locale}/carriers`);
  const message = insertedCount > 0 ? `${insertedCount} transporteurs de démonstration ajoutés.` : "Les transporteurs de démonstration sont déjà présents.";
  redirect(`/${locale}/carriers?message=${encodeURIComponent(message)}`);
}
