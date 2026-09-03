"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { demoBrokers } from "@/lib/demo/brokers";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireManager(locale: Locale) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/brokers?message=${encodeURIComponent("Permission refusée.")}`);
  }

  return workspace;
}

export async function createBroker(locale: Locale, formData: FormData) {
  const workspace = await requireManager(locale);
  const name = readField(formData, "name");

  if (!name) {
    redirect(`/${locale}/brokers?message=${encodeURIComponent("Le nom du courtier est requis.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("brokers").insert({
    workspace_id: workspace.id,
    name,
    contact_name: readField(formData, "contactName") || null,
    email: readField(formData, "email") || null,
    phone: readField(formData, "phone") || null,
    address: readField(formData, "address") || null,
    is_default_usa: formData.get("isDefaultUsa") === "on",
    notes: readField(formData, "notes") || null,
  });

  if (error) {
    logServerError({ action: "create_broker", error });
    redirect(`/${locale}/brokers?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  revalidatePath(`/${locale}/brokers`);
  redirect(`/${locale}/brokers?message=${encodeURIComponent("Courtier ajouté.")}`);
}

export async function seedDemoBrokers(locale: Locale) {
  const workspace = await requireManager(locale);
  const supabase = await createClient();
  let insertedCount = 0;

  for (const broker of demoBrokers) {
    const { data: existing, error: lookupError } = await supabase
      .from("brokers")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", broker.name)
      .maybeSingle();

    if (lookupError) {
      logServerError({ action: "seed_demo_brokers_lookup", error: lookupError });
      redirect(`/${locale}/brokers?message=${encodeURIComponent(genericActionError(locale))}`);
    }

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("brokers").insert({
      workspace_id: workspace.id,
      name: broker.name,
      contact_name: broker.contactName,
      email: broker.email,
      phone: broker.phone,
      address: broker.address,
      is_default_usa: broker.isDefaultUsa,
      notes: broker.notes,
    });

    if (error) {
      logServerError({ action: "seed_demo_brokers_insert", error });
      redirect(`/${locale}/brokers?message=${encodeURIComponent(genericActionError(locale))}`);
    }

    insertedCount += 1;
  }

  revalidatePath(`/${locale}/brokers`);
  const message = insertedCount > 0 ? `${insertedCount} courtiers de démonstration ajoutés.` : "Les courtiers de démonstration sont déjà présents.";
  redirect(`/${locale}/brokers?message=${encodeURIComponent(message)}`);
}
