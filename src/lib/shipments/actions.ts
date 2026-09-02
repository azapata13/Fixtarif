"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { PackageType, PaymentTerm, ShipmentReason } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
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
