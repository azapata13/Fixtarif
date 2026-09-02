"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { PaymentTerm, ShipmentReason } from "@/lib/supabase/types";
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

export async function createShipmentDraft(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const reference = readField(formData, "reference");
  const productName = readField(formData, "productName");
  const quantity = readPositiveNumber(formData, "quantity");
  const weight = readPositiveNumber(formData, "weight");

  if (!reference || !productName || !quantity || !weight) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent("Référence, produit, quantité et poids sont requis.")}`);
  }

  const supabase = await createClient();
  const productId = readOptionalId(formData, "productId");
  const carrierId = readOptionalId(formData, "carrierId");

  const { data: product } = productId
    ? await supabase.from("products").select("*").eq("workspace_id", workspace.id).eq("id", productId).maybeSingle()
    : { data: null };

  const { data: carrier } = carrierId
    ? await supabase.from("carriers").select("*").eq("workspace_id", workspace.id).eq("id", carrierId).maybeSingle()
    : { data: null };

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
    part_number: readField(formData, "partNumber") || null,
    quantity,
    quantity_confirmed: formData.get("quantityConfirmed") === "on",
    weight,
    weight_unit: "lb",
    weight_confirmed: formData.get("weightConfirmed") === "on",
    package_type: "pallet",
    lot_number: readField(formData, "lotNumber") || null,
  });

  if (itemError) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(itemError.message)}`);
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
