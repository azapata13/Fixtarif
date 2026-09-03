"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { PackageType, PaymentTerm, ShipmentReason, ShipmentStatus } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { getNextShipmentReference } from "@/lib/shipments/queries";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalId(formData: FormData, key: string) {
  const value = readField(formData, key);
  return value || null;
}

function readPositiveNumber(formData: FormData, key: string) {
  const value = Number(readField(formData, key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readReason(formData: FormData): ShipmentReason {
  const value = readField(formData, "reason");
  const allowed: ShipmentReason[] = ["sale", "subcontracting", "repair", "treatment", "return_rma", "sample_test", "loaned_material", "tools_return", "other"];
  return allowed.includes(value as ShipmentReason) ? (value as ShipmentReason) : "sale";
}

function readPaymentTerm(formData: FormData): PaymentTerm {
  const value = readField(formData, "paymentTerm");
  const allowed: PaymentTerm[] = ["prepaid", "collect", "third_party"];
  return allowed.includes(value as PaymentTerm) ? (value as PaymentTerm) : "prepaid";
}

function readPackageType(formData: FormData): PackageType {
  const value = readField(formData, "packageType");
  const allowed: PackageType[] = ["pallet", "box", "crate", "bundle", "drum", "other"];
  return allowed.includes(value as PackageType) ? (value as PackageType) : "pallet";
}

function readShipmentStatus(formData: FormData): ShipmentStatus {
  const value = readField(formData, "status");
  const allowed: ShipmentStatus[] = ["draft", "validation", "ready", "archived"];
  return allowed.includes(value as ShipmentStatus) ? (value as ShipmentStatus) : "draft";
}

async function getShipmentValidationState(workspaceId: string, shipmentId: string) {
  const supabase = await createClient();
  const [{ data: shipment }, { data: items }, { data: packages }, { data: transport }] = await Promise.all([
    supabase
      .from("shipments")
      .select("id,destination_business_id,destination_site_id,destination_contact_id,carrier_id")
      .eq("workspace_id", workspaceId)
      .eq("id", shipmentId)
      .maybeSingle(),
    supabase
      .from("shipment_items")
      .select("id,quantity_confirmed,weight_confirmed")
      .eq("workspace_id", workspaceId)
      .eq("shipment_id", shipmentId),
    supabase
      .from("shipment_packages")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("shipment_id", shipmentId),
    supabase
      .from("shipment_transport")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("shipment_id", shipmentId),
  ]);

  const firstItem = items?.[0];

  return {
    exists: Boolean(shipment),
    complete: Boolean(
      shipment?.destination_business_id &&
        shipment.destination_site_id &&
        shipment.destination_contact_id &&
        shipment.carrier_id &&
        firstItem?.quantity_confirmed &&
        firstItem.weight_confirmed &&
        packages?.length &&
        transport?.length,
    ),
  };
}

export async function createShipmentDraft(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const reference = readField(formData, "reference");
  const productNameFromForm = readField(formData, "productName");
  const quantity = readPositiveNumber(formData, "quantity");
  const weight = readPositiveNumber(formData, "weight");

  if (!reference || !quantity || !weight) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent("Référence, produit, quantité et poids sont requis.")}`);
  }

  const supabase = await createClient();
  const productId = readOptionalId(formData, "productId");
  const carrierId = readOptionalId(formData, "carrierId");
  const packageCount = Math.max(1, Math.trunc(readPositiveNumber(formData, "packageCount") ?? 1));

  const { data: product } = productId
    ? await supabase.from("products").select("*").eq("workspace_id", workspace.id).eq("id", productId).maybeSingle()
    : { data: null };

  const { data: carrier } = carrierId
    ? await supabase.from("carriers").select("*").eq("workspace_id", workspace.id).eq("id", carrierId).maybeSingle()
    : { data: null };

  const productName = productNameFromForm || product?.name;

  if (!productName) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent("Le nom du produit est requis.")}`);
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .insert({
      workspace_id: workspace.id,
      reference,
      destination_country: "CA",
      reason: readReason(formData),
      language: locale,
      status: "draft",
      created_by: user.id,
      destination_business_id: readOptionalId(formData, "destinationBusinessId"),
      destination_site_id: readOptionalId(formData, "destinationSiteId"),
      destination_contact_id: readOptionalId(formData, "destinationContactId"),
      carrier_id: carrierId,
      notes: readField(formData, "notes") || null,
    })
    .select("id")
    .single();

  if (shipmentError) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(shipmentError.message)}`);
  }

  const { error: itemError } = await supabase.from("shipment_items").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    product_id: productId,
    product_snapshot_json: product ?? {},
    name: productName,
    part_number: readField(formData, "partNumber") || product?.part_number || null,
    quantity,
    quantity_confirmed: formData.get("quantityConfirmed") === "on",
    weight,
    weight_unit: readField(formData, "weightUnit") === "kg" ? "kg" : "lb",
    weight_confirmed: formData.get("weightConfirmed") === "on",
    length: readPositiveNumber(formData, "length"),
    width: readPositiveNumber(formData, "width"),
    height: readPositiveNumber(formData, "height"),
    dimension_unit: readField(formData, "dimensionUnit") === "cm" ? "cm" : "in",
    package_type: readPackageType(formData),
    lot_number: readField(formData, "lotNumber") || null,
  });

  if (itemError) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(itemError.message)}`);
  }

  const { error: packageError } = await supabase.from("shipment_packages").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    package_number: 1,
    package_count: packageCount,
    package_type: readPackageType(formData),
    weight,
    weight_unit: readField(formData, "weightUnit") === "kg" ? "kg" : "lb",
    length: readPositiveNumber(formData, "length"),
    width: readPositiveNumber(formData, "width"),
    height: readPositiveNumber(formData, "height"),
    dimension_unit: readField(formData, "dimensionUnit") === "cm" ? "cm" : "in",
    stackable: formData.get("stackable") === "on",
    destination_label: readField(formData, "destinationLabel") || null,
  });

  if (packageError) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(packageError.message)}`);
  }

  const { error: transportError } = await supabase.from("shipment_transport").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    carrier_id: carrierId,
    carrier_snapshot_json: carrier ?? {},
    payment_term: readPaymentTerm(formData),
    needs_bol: formData.get("needsBol") === "on",
  });

  if (transportError) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(transportError.message)}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    actor_user_id: user.id,
    action: "shipment_draft_created",
    metadata_json: { source: "manual_canada" },
  });

  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments?message=${encodeURIComponent("Brouillon d'expédition créé.")}`);
}

export async function duplicateShipmentDraft(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");

  if (!shipmentId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  const supabase = await createClient();
  const [{ data: source, error: sourceError }, { data: items }, { data: packages }, { data: transport }] = await Promise.all([
    supabase
      .from("shipments")
      .select("destination_country,reason,language,destination_business_id,destination_site_id,destination_contact_id,carrier_id,notes")
      .eq("workspace_id", workspace.id)
      .eq("id", shipmentId)
      .maybeSingle(),
    supabase.from("shipment_items").select("*").eq("workspace_id", workspace.id).eq("shipment_id", shipmentId),
    supabase.from("shipment_packages").select("*").eq("workspace_id", workspace.id).eq("shipment_id", shipmentId),
    supabase.from("shipment_transport").select("*").eq("workspace_id", workspace.id).eq("shipment_id", shipmentId).maybeSingle(),
  ]);

  if (sourceError || !source) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent(sourceError?.message ?? "Expédition introuvable.")}`);
  }

  const reference = await getNextShipmentReference(workspace.id);
  const { data: duplicated, error: shipmentError } = await supabase
    .from("shipments")
    .insert({
      workspace_id: workspace.id,
      reference,
      destination_country: source.destination_country,
      reason: source.reason,
      language: locale,
      status: "draft",
      created_by: user.id,
      destination_business_id: source.destination_business_id,
      destination_site_id: source.destination_site_id,
      destination_contact_id: source.destination_contact_id,
      carrier_id: source.carrier_id,
      notes: source.notes,
    })
    .select("id")
    .single();

  if (shipmentError) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(shipmentError.message)}`);
  }

  if (items?.length) {
    const { error } = await supabase.from("shipment_items").insert(
      items.map((item) => ({
        workspace_id: workspace.id,
        shipment_id: duplicated.id,
        product_id: item.product_id,
        product_snapshot_json: item.product_snapshot_json,
        name: item.name,
        part_number: item.part_number,
        quantity: item.quantity,
        quantity_confirmed: false,
        weight: item.weight,
        weight_unit: item.weight_unit,
        weight_confirmed: false,
        length: item.length,
        width: item.width,
        height: item.height,
        dimension_unit: item.dimension_unit,
        package_type: item.package_type,
        lot_number: null,
        container_reference: null,
        release_note_reference: null,
        notes: item.notes,
      })),
    );

    if (error) {
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(error.message)}`);
    }
  }

  if (packages?.length) {
    const { error } = await supabase.from("shipment_packages").insert(
      packages.map((packageRow) => ({
        workspace_id: workspace.id,
        shipment_id: duplicated.id,
        package_number: packageRow.package_number,
        package_count: packageRow.package_count,
        package_type: packageRow.package_type,
        weight: packageRow.weight,
        weight_unit: packageRow.weight_unit,
        length: packageRow.length,
        width: packageRow.width,
        height: packageRow.height,
        dimension_unit: packageRow.dimension_unit,
        stackable: packageRow.stackable,
        destination_label: packageRow.destination_label,
        notes: packageRow.notes,
      })),
    );

    if (error) {
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(error.message)}`);
    }
  }

  if (transport) {
    const { error } = await supabase.from("shipment_transport").insert({
      workspace_id: workspace.id,
      shipment_id: duplicated.id,
      carrier_id: transport.carrier_id,
      carrier_snapshot_json: transport.carrier_snapshot_json,
      payment_term: transport.payment_term,
      needs_bol: transport.needs_bol,
    });

    if (error) {
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(error.message)}`);
    }
  }

  await supabase.from("shipment_audit_log").insert([
    {
      workspace_id: workspace.id,
      shipment_id: shipmentId,
      actor_user_id: user.id,
      action: "shipment_duplicated_from",
      metadata_json: { duplicatedShipmentId: duplicated.id, reference },
    },
    {
      workspace_id: workspace.id,
      shipment_id: duplicated.id,
      actor_user_id: user.id,
      action: "shipment_duplicated",
      metadata_json: { sourceShipmentId: shipmentId },
    },
  ]);

  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments/${duplicated.id}?message=${encodeURIComponent("Brouillon dupliqué. Revalidez le lot, la quantité et le poids.")}`);
}

export async function updateShipmentItemConfirmations(locale: Locale, formData: FormData) {
  const { workspace, user } = await getCurrentWorkspace();

  if (!workspace || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");
  const itemId = readField(formData, "itemId");

  if (!shipmentId || !itemId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  const supabase = await createClient();
  const quantityConfirmed = formData.get("quantityConfirmed") === "on";
  const weightConfirmed = formData.get("weightConfirmed") === "on";

  const { error } = await supabase
    .from("shipment_items")
    .update({
      quantity_confirmed: quantityConfirmed,
      weight_confirmed: weightConfirmed,
    })
    .eq("workspace_id", workspace.id)
    .eq("shipment_id", shipmentId)
    .eq("id", itemId);

  if (error) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipmentId,
    actor_user_id: user.id,
    action: "shipment_item_confirmations_updated",
    metadata_json: { itemId, quantityConfirmed, weightConfirmed },
  });

  revalidatePath(`/${locale}/shipments/${shipmentId}`);
  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Confirmations mises à jour.")}`);
}

export async function updateShipmentTransportReferences(locale: Locale, formData: FormData) {
  const { workspace, user } = await getCurrentWorkspace();

  if (!workspace || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");
  const transportId = readField(formData, "transportId");

  if (!shipmentId || !transportId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Transport introuvable.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shipment_transport")
    .update({
      pro_number: readField(formData, "proNumber") || null,
      bol_number: readField(formData, "bolNumber") || null,
      needs_bol: formData.get("needsBol") === "on",
    })
    .eq("workspace_id", workspace.id)
    .eq("shipment_id", shipmentId)
    .eq("id", transportId);

  if (error) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipmentId,
    actor_user_id: user.id,
    action: "shipment_transport_references_updated",
    metadata_json: {
      hasProNumber: Boolean(readField(formData, "proNumber")),
      hasBolNumber: Boolean(readField(formData, "bolNumber")),
    },
  });

  revalidatePath(`/${locale}/shipments/${shipmentId}`);
  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Références transport mises à jour.")}`);
}

export async function updateShipmentStatus(locale: Locale, formData: FormData) {
  const { workspace, user } = await getCurrentWorkspace();

  if (!workspace || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");
  const status = readShipmentStatus(formData);

  if (!shipmentId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  const validation = await getShipmentValidationState(workspace.id, shipmentId);

  if (!validation.exists) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  if (status === "ready" && !validation.complete) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Validation incomplète. Confirmez destination, produit, poids, quantité, transporteur et colis.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shipments")
    .update({ status })
    .eq("workspace_id", workspace.id)
    .eq("id", shipmentId);

  if (error) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipmentId,
    actor_user_id: user.id,
    action: "shipment_status_updated",
    metadata_json: { status },
  });

  revalidatePath(`/${locale}/shipments/${shipmentId}`);
  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Statut mis à jour.")}`);
}
