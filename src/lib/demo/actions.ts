"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { demoBrokers } from "@/lib/demo/brokers";
import { demoCarriers } from "@/lib/demo/carriers";
import { demoClients } from "@/lib/demo/clients";
import { demoProducts } from "@/lib/demo/products";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type DemoBusiness = {
  id: string;
  contactId: string | null;
  siteId: string | null;
};

async function requireManager(locale: Locale) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/dashboard?message=${encodeURIComponent("Permission refusée.")}`);
  }

  return { workspace, user };
}

async function upsertDemoBusinesses(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const businesses = new Map<string, DemoBusiness>();
  let insertedCount = 0;

  for (const client of demoClients) {
    const { data: existing, error: lookupError } = await supabase
      .from("businesses")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", client.name)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    let businessId = existing?.id;

    if (!businessId) {
      const { data: business, error } = await supabase
        .from("businesses")
        .insert({
          workspace_id: workspaceId,
          name: client.name,
          email: client.email,
          phone: client.phone,
          roles: client.role === "Client USA" ? ["client", "buyer"] : ["client"],
          notes: client.notes,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      businessId = business.id;
      insertedCount += 1;
    }

    const { data: site, error: siteLookupError } = await supabase
      .from("business_sites")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("business_id", businessId)
      .eq("name", "Principal")
      .maybeSingle();

    if (siteLookupError) {
      throw siteLookupError;
    }

    let siteId = site?.id ?? null;

    if (!siteId) {
      const { data: createdSite, error } = await supabase
        .from("business_sites")
        .insert({
          workspace_id: workspaceId,
          business_id: businessId,
          name: "Principal",
          city: client.city,
          region: client.region,
          country: client.region === "NY" ? "US" : "CA",
          call_before_minutes: client.name === "Atelier Nordik" ? 30 : null,
          dock_info: client.name === "Atelier Nordik" ? "Quai de réception" : null,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      siteId = createdSite.id;
    }

    const { data: contact, error: contactLookupError } = await supabase
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("business_id", businessId)
      .eq("email", client.email)
      .maybeSingle();

    if (contactLookupError) {
      throw contactLookupError;
    }

    let contactId = contact?.id ?? null;

    if (!contactId) {
      const { data: createdContact, error } = await supabase
        .from("contacts")
        .insert({
          workspace_id: workspaceId,
          business_id: businessId,
          site_id: siteId,
          name: client.contact,
          email: client.email,
          phone: client.phone,
          contact_type: "receiving",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      contactId = createdContact.id;
    }

    businesses.set(client.name, { id: businessId, contactId, siteId });
  }

  return { businesses, insertedCount };
}

async function upsertDemoProducts(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const products = new Map<string, (typeof demoProducts)[number] & { id: string }>();
  let insertedCount = 0;

  for (const product of demoProducts) {
    const { data: existing, error: lookupError } = await supabase
      .from("products")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("part_number", product.partNumber)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    let productId = existing?.id;

    if (!productId) {
      const { data: createdProduct, error } = await supabase
        .from("products")
        .insert({
          workspace_id: workspaceId,
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
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      productId = createdProduct.id;
      insertedCount += 1;
    }

    products.set(product.partNumber, { ...product, id: productId });
  }

  return { insertedCount, products };
}

async function upsertDemoCarriers(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const carriers = new Map<string, { id: string; defaultProvidesBol: boolean }>();
  let insertedCount = 0;

  for (const carrier of demoCarriers) {
    const { data: existing, error: lookupError } = await supabase
      .from("carriers")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", carrier.name)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    let carrierId = existing?.id;

    if (!carrierId) {
      const { data: createdCarrier, error } = await supabase
        .from("carriers")
        .insert({
          workspace_id: workspaceId,
          name: carrier.name,
          carrier_type: carrier.carrierType,
          email: carrier.email,
          phone: carrier.phone,
          default_provides_bol: carrier.defaultProvidesBol,
          notes: carrier.notes,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      carrierId = createdCarrier.id;
      insertedCount += 1;
    }

    carriers.set(carrier.name, { id: carrierId, defaultProvidesBol: carrier.defaultProvidesBol });
  }

  return { carriers, insertedCount };
}

async function upsertDemoBrokers(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  let insertedCount = 0;

  for (const broker of demoBrokers) {
    const { data: existing, error: lookupError } = await supabase
      .from("brokers")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", broker.name)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existing) {
      continue;
    }

    const { error } = await supabase.from("brokers").insert({
      workspace_id: workspaceId,
      name: broker.name,
      contact_name: broker.contactName,
      email: broker.email,
      phone: broker.phone,
      address: broker.address,
      is_default_usa: broker.isDefaultUsa,
      notes: broker.notes,
    });

    if (error) {
      throw error;
    }

    insertedCount += 1;
  }

  return insertedCount;
}

async function createDemoShipment({
  business,
  carrierId,
  country,
  product,
  reference,
  supabase,
  userId,
  workspaceId,
}: {
  business: DemoBusiness;
  carrierId: string;
  country: "CA" | "US";
  product: (typeof demoProducts)[number] & { id: string };
  reference: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  workspaceId: string;
}) {
  const { data: existing, error: lookupError } = await supabase
    .from("shipments")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("reference", reference)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing) {
    return false;
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .insert({
      workspace_id: workspaceId,
      reference,
      destination_country: country,
      reason: "sale",
      language: "fr",
      status: "draft",
      created_by: userId,
      destination_business_id: business.id,
      destination_site_id: business.siteId,
      destination_contact_id: business.contactId,
      carrier_id: carrierId,
      notes: "Brouillon de démonstration généré pour tester le parcours MVP.",
    })
    .select("id")
    .single();

  if (shipmentError) {
    throw shipmentError;
  }

  const { error: itemError } = await supabase.from("shipment_items").insert({
    workspace_id: workspaceId,
    shipment_id: shipment.id,
    product_id: product.id,
    product_snapshot_json: product,
    name: product.name,
    part_number: product.partNumber,
    quantity: 1,
    quantity_confirmed: false,
    weight: product.weight,
    weight_unit: product.weightUnit,
    weight_confirmed: false,
    length: product.length,
    width: product.width,
    height: product.height,
    dimension_unit: product.dimensionUnit,
    package_type: product.packageType,
    notes: "Confirmer quantité, poids et lot avant génération.",
  });

  if (itemError) {
    throw itemError;
  }

  const { error: packageError } = await supabase.from("shipment_packages").insert({
    workspace_id: workspaceId,
    shipment_id: shipment.id,
    package_number: 1,
    package_count: 1,
    package_type: product.packageType,
    weight: product.weight,
    weight_unit: product.weightUnit,
    length: product.length,
    width: product.width,
    height: product.height,
    dimension_unit: product.dimensionUnit,
    stackable: product.stackable,
  });

  if (packageError) {
    throw packageError;
  }

  const { error: transportError } = await supabase.from("shipment_transport").insert({
    workspace_id: workspaceId,
    shipment_id: shipment.id,
    carrier_id: carrierId,
    payment_term: "prepaid",
    needs_bol: country === "CA",
  });

  if (transportError) {
    throw transportError;
  }

  return true;
}

export async function prepareDemoWorkspace(locale: Locale) {
  const { workspace, user } = await requireManager(locale);
  const supabase = await createClient();

  try {
    const [{ businesses, insertedCount: businessesInserted }, { products, insertedCount: productsInserted }, { carriers, insertedCount: carriersInserted }, brokersInserted] =
      await Promise.all([
        upsertDemoBusinesses(supabase, workspace.id),
        upsertDemoProducts(supabase, workspace.id),
        upsertDemoCarriers(supabase, workspace.id),
        upsertDemoBrokers(supabase, workspace.id),
      ]);

    const caCreated = await createDemoShipment({
      business: businesses.get("Atelier Nordik")!,
      carrierId: carriers.get("Nordik Transport")!.id,
      country: "CA",
      product: products.get("ID-43567")!,
      reference: "ST-DEMO-CA",
      supabase,
      userId: user.id,
      workspaceId: workspace.id,
    });

    const usCreated = await createDemoShipment({
      business: businesses.get("Great Lakes Fabrication")!,
      carrierId: carriers.get("Lakeside Freight")!.id,
      country: "US",
      product: products.get("ID-43567")!,
      reference: "ST-DEMO-US",
      supabase,
      userId: user.id,
      workspaceId: workspace.id,
    });

    await supabase.from("shipment_audit_log").insert({
      workspace_id: workspace.id,
      actor_user_id: user.id,
      action: "demo_workspace_prepared",
      metadata_json: {
        brokersInserted,
        businessesInserted,
        carriersInserted,
        demoShipmentsInserted: [caCreated, usCreated].filter(Boolean).length,
        productsInserted,
      },
    });

    revalidatePath(`/${locale}/dashboard`);
    revalidatePath(`/${locale}/shipments`);
    revalidatePath(`/${locale}/products`);
    revalidatePath(`/${locale}/companies`);
    revalidatePath(`/${locale}/carriers`);
    revalidatePath(`/${locale}/brokers`);
  } catch (error) {
    logServerError({ action: "prepare_demo_workspace", error });
    redirect(`/${locale}/dashboard?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  redirect(`/${locale}/dashboard?message=${encodeURIComponent("Démo MVP préparée: clients, produits, transporteurs, courtiers et brouillons ajoutés.")}`);
}
