"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { BusinessRole } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { demoClients } from "@/lib/demo/clients";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readRole(formData: FormData): BusinessRole {
  const role = readField(formData, "role");
  const allowed: BusinessRole[] = ["client", "supplier", "subcontractor", "consignee", "buyer", "other"];
  return allowed.includes(role as BusinessRole) ? (role as BusinessRole) : "client";
}

export async function createBusiness(locale: Locale, formData: FormData) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const name = readField(formData, "name");

  if (!name) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Le nom de l'entreprise est requis.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").insert({
    workspace_id: workspace.id,
    name,
    email: readField(formData, "email") || null,
    phone: readField(formData, "phone") || null,
    roles: [readRole(formData)],
    notes: readField(formData, "notes") || null,
  });

  if (error) {
    redirect(`/${locale}/companies?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/companies`);
  redirect(`/${locale}/companies`);
}

export async function seedDemoBusinesses(locale: Locale) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const supabase = await createClient();

  for (const client of demoClients) {
    const { data: existing, error: lookupError } = await supabase
      .from("businesses")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", client.name)
      .maybeSingle();

    if (lookupError) {
      redirect(`/${locale}/companies?message=${encodeURIComponent(lookupError.message)}`);
    }

    if (existing) {
      continue;
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        workspace_id: workspace.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        roles: client.role === "Client USA" ? ["client", "buyer"] : ["client"],
        notes: client.notes,
      })
      .select("id")
      .single();

    if (businessError) {
      redirect(`/${locale}/companies?message=${encodeURIComponent(businessError.message)}`);
    }

    const { data: site, error: siteError } = await supabase
      .from("business_sites")
      .insert({
        workspace_id: workspace.id,
        business_id: business.id,
        name: "Principal",
        city: client.city,
        region: client.region,
        country: client.region === "NY" ? "US" : "CA",
        call_before_minutes: client.name === "Atelier Nordik" ? 30 : null,
        dock_info: client.name === "Atelier Nordik" ? "Quai de réception" : null,
      })
      .select("id")
      .single();

    if (siteError) {
      redirect(`/${locale}/companies?message=${encodeURIComponent(siteError.message)}`);
    }

    const { error: contactError } = await supabase.from("contacts").insert({
      workspace_id: workspace.id,
      business_id: business.id,
      site_id: site.id,
      name: client.contact,
      email: client.email,
      phone: client.phone,
      contact_type: "receiving",
    });

    if (contactError) {
      redirect(`/${locale}/companies?message=${encodeURIComponent(contactError.message)}`);
    }
  }

  revalidatePath(`/${locale}/companies`);
  redirect(`/${locale}/companies`);
}
