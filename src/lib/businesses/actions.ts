"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { BusinessRole, ContactType } from "@/lib/supabase/types";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
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

function readContactType(formData: FormData): ContactType {
  const contactType = readField(formData, "contactType");
  const allowed: ContactType[] = ["commercial", "receiving", "shipping", "project", "accounting", "other"];
  return allowed.includes(contactType as ContactType) ? (contactType as ContactType) : "receiving";
}

function readPositiveInteger(formData: FormData, key: string) {
  const value = Number(readField(formData, key));
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
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
    logServerError({ action: "create_business", error });
    redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  revalidatePath(`/${locale}/companies`);
  redirect(`/${locale}/companies`);
}

export async function createBusinessSite(locale: Locale, formData: FormData) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const businessId = readField(formData, "businessId");
  const name = readField(formData, "siteName") || "Principal";

  if (!businessId) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Choisis une entreprise pour le site.")}`);
  }

  const country = readField(formData, "country") === "US" ? "US" : "CA";
  const supabase = await createClient();
  const { error } = await supabase.from("business_sites").insert({
    workspace_id: workspace.id,
    business_id: businessId,
    name,
    address: readField(formData, "address") || null,
    city: readField(formData, "city") || null,
    region: readField(formData, "region") || null,
    postal_code: readField(formData, "postalCode") || null,
    country,
    dock_info: readField(formData, "dockInfo") || null,
    appointment_required: readCheckbox(formData, "appointmentRequired"),
    flatbed_required: readCheckbox(formData, "flatbedRequired"),
    call_before_minutes: readPositiveInteger(formData, "callBeforeMinutes"),
    notes: readField(formData, "notes") || null,
  });

  if (error) {
    logServerError({ action: "create_business_site", error });
    redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  revalidatePath(`/${locale}/companies`);
  redirect(`/${locale}/companies?message=${encodeURIComponent("Site ajouté.")}`);
}

export async function createBusinessContact(locale: Locale, formData: FormData) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Permission refusée.")}`);
  }

  const businessId = readField(formData, "businessId");
  const name = readField(formData, "contactName");
  const siteId = readField(formData, "siteId");

  if (!businessId || !name) {
    redirect(`/${locale}/companies?message=${encodeURIComponent("Entreprise et nom du contact requis.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    workspace_id: workspace.id,
    business_id: businessId,
    site_id: siteId || null,
    name,
    role: readField(formData, "contactRole") || null,
    email: readField(formData, "email") || null,
    phone: readField(formData, "phone") || null,
    extension: readField(formData, "extension") || null,
    contact_type: readContactType(formData),
  });

  if (error) {
    logServerError({ action: "create_business_contact", error });
    redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  revalidatePath(`/${locale}/companies`);
  redirect(`/${locale}/companies?message=${encodeURIComponent("Contact ajouté.")}`);
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
  let insertedCount = 0;

  for (const client of demoClients) {
    const { data: existing, error: lookupError } = await supabase
      .from("businesses")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", client.name)
      .maybeSingle();

    if (lookupError) {
      logServerError({ action: "seed_demo_businesses_lookup", error: lookupError });
      redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
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
      logServerError({ action: "seed_demo_businesses_insert_business", error: businessError });
      redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
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
      logServerError({ action: "seed_demo_businesses_insert_site", error: siteError });
      redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
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
      logServerError({ action: "seed_demo_businesses_insert_contact", error: contactError });
      redirect(`/${locale}/companies?message=${encodeURIComponent(genericActionError(locale))}`);
    }

    insertedCount += 1;
  }

  revalidatePath(`/${locale}/companies`);
  const message = insertedCount > 0 ? `${insertedCount} clients de démonstration ajoutés.` : "Les clients de démonstration sont déjà présents.";
  redirect(`/${locale}/companies?message=${encodeURIComponent(message)}`);
}
