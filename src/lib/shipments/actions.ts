"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { PackageType, PaymentTerm, ShipmentReason, ShipmentStatus } from "@/lib/supabase/types";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
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

function readDestinationCountry(formData: FormData): "CA" | "US" {
  return readField(formData, "destinationCountry") === "US" ? "US" : "CA";
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

async function validateShipmentDraftRelations({
  carrierId,
  contactId,
  destinationBusinessId,
  productId,
  siteId,
  workspaceId,
}: {
  carrierId: string | null;
  contactId: string | null;
  destinationBusinessId: string | null;
  productId: string | null;
  siteId: string | null;
  workspaceId: string;
}) {
  const supabase = await createClient();

  const [businessResult, siteResult, contactResult, productResult, carrierResult] = await Promise.all([
    destinationBusinessId ? supabase.from("businesses").select("id").eq("workspace_id", workspaceId).eq("id", destinationBusinessId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    siteId ? supabase.from("business_sites").select("id,business_id").eq("workspace_id", workspaceId).eq("id", siteId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    contactId ? supabase.from("contacts").select("id,business_id,site_id").eq("workspace_id", workspaceId).eq("id", contactId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    productId ? supabase.from("products").select("id").eq("workspace_id", workspaceId).eq("id", productId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    carrierId ? supabase.from("carriers").select("id").eq("workspace_id", workspaceId).eq("id", carrierId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);

  const queryError = businessResult.error ?? siteResult.error ?? contactResult.error ?? productResult.error ?? carrierResult.error;

  if (queryError) {
    logServerError({ action: "validate_shipment_relations", error: queryError });
    return { valid: false, message: "Validation impossible pour le moment." };
  }

  if (destinationBusinessId && !businessResult.data) {
    return { valid: false, message: "Destination invalide." };
  }

  if (siteId && (!siteResult.data || siteResult.data.business_id !== destinationBusinessId)) {
    return { valid: false, message: "Le site choisi ne correspond pas à cette destination." };
  }

  if (
    contactId &&
    (!contactResult.data ||
      contactResult.data.business_id !== destinationBusinessId ||
      (siteId && contactResult.data.site_id && contactResult.data.site_id !== siteId))
  ) {
    return { valid: false, message: "Le contact choisi ne correspond pas à cette destination." };
  }

  if (productId && !productResult.data) {
    return { valid: false, message: "Produit invalide." };
  }

  if (carrierId && !carrierResult.data) {
    return { valid: false, message: "Transporteur invalide." };
  }

  return { valid: true, message: "" };
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
  const destinationBusinessId = readOptionalId(formData, "destinationBusinessId");
  const destinationSiteId = readOptionalId(formData, "destinationSiteId");
  const destinationContactId = readOptionalId(formData, "destinationContactId");
  const destinationCountry = readDestinationCountry(formData);
  const packageCount = Math.max(1, Math.trunc(readPositiveNumber(formData, "packageCount") ?? 1));
  const relationValidation = await validateShipmentDraftRelations({
    carrierId,
    contactId: destinationContactId,
    destinationBusinessId,
    productId,
    siteId: destinationSiteId,
    workspaceId: workspace.id,
  });

  if (!relationValidation.valid) {
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(relationValidation.message)}`);
  }

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
      destination_country: destinationCountry,
      reason: readReason(formData),
      language: locale,
      status: "draft",
      created_by: user.id,
      destination_business_id: destinationBusinessId,
      destination_site_id: destinationSiteId,
      destination_contact_id: destinationContactId,
      carrier_id: carrierId,
      notes: readField(formData, "notes") || null,
    })
    .select("id")
    .single();

  if (shipmentError) {
    logServerError({ action: "create_shipment", error: shipmentError });
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(genericActionError(locale))}`);
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
    logServerError({ action: "create_shipment_item", error: itemError });
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(genericActionError(locale))}`);
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
    logServerError({ action: "create_shipment_package", error: packageError });
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(genericActionError(locale))}`);
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
    logServerError({ action: "create_shipment_transport", error: transportError });
    redirect(`/${locale}/shipments/new?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    actor_user_id: user.id,
    action: "shipment_draft_created",
    metadata_json: { destination_country: destinationCountry, source: "manual" },
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
    if (sourceError) {
      logServerError({ action: "duplicate_shipment_source", error: sourceError });
    }
    redirect(`/${locale}/shipments?message=${encodeURIComponent(sourceError ? genericActionError(locale) : "Expédition introuvable.")}`);
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
    logServerError({ action: "duplicate_shipment_create", error: shipmentError });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
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
      logServerError({ action: "duplicate_shipment_items", error });
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
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
      logServerError({ action: "duplicate_shipment_packages", error });
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
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
      logServerError({ action: "duplicate_shipment_transport", error });
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
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
    logServerError({ action: "update_shipment_item_confirmations", error });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
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

export async function updateShipmentDestination(locale: Locale, formData: FormData) {
  const { workspace, user } = await getCurrentWorkspace();

  if (!workspace || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");
  const destinationBusinessId = readOptionalId(formData, "destinationBusinessId");
  const destinationSiteId = readOptionalId(formData, "destinationSiteId");
  const destinationContactId = readOptionalId(formData, "destinationContactId");

  if (!shipmentId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  const relationValidation = await validateShipmentDraftRelations({
    carrierId: null,
    contactId: destinationContactId,
    destinationBusinessId,
    productId: null,
    siteId: destinationSiteId,
    workspaceId: workspace.id,
  });

  if (!relationValidation.valid) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(relationValidation.message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shipments")
    .update({
      destination_business_id: destinationBusinessId,
      destination_site_id: destinationSiteId,
      destination_contact_id: destinationContactId,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", shipmentId);

  if (error) {
    logServerError({ action: "update_shipment_destination", error });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipmentId,
    actor_user_id: user.id,
    action: "shipment_destination_updated",
    metadata_json: { destinationBusinessId, destinationSiteId, destinationContactId },
  });

  revalidatePath(`/${locale}/shipments/${shipmentId}`);
  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Destination mise à jour.")}`);
}

export async function updateShipmentGoodsAndPackage(locale: Locale, formData: FormData) {
  const { workspace, user } = await getCurrentWorkspace();

  if (!workspace || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");
  const itemId = readField(formData, "itemId");
  const packageId = readField(formData, "packageId");
  const productId = readOptionalId(formData, "productId");
  const quantity = readPositiveNumber(formData, "quantity");
  const weight = readPositiveNumber(formData, "weight");
  const productNameFromForm = readField(formData, "productName");

  if (!shipmentId || !itemId || !quantity || !weight) {
    redirect(`/${locale}/shipments/${shipmentId || ""}?message=${encodeURIComponent("Produit, quantité et poids sont requis.")}`);
  }

  const relationValidation = await validateShipmentDraftRelations({
    carrierId: null,
    contactId: null,
    destinationBusinessId: null,
    productId,
    siteId: null,
    workspaceId: workspace.id,
  });

  if (!relationValidation.valid) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(relationValidation.message)}`);
  }

  const supabase = await createClient();
  const { data: product } = productId
    ? await supabase.from("products").select("*").eq("workspace_id", workspace.id).eq("id", productId).maybeSingle()
    : { data: null };
  const productName = productNameFromForm || product?.name;

  if (!productName) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Le nom du produit est requis.")}`);
  }

  const weightUnit = readField(formData, "weightUnit") === "kg" ? "kg" : "lb";
  const dimensionUnit = readField(formData, "dimensionUnit") === "cm" ? "cm" : "in";
  const packageType = readPackageType(formData);
  const packageCount = Math.max(1, Math.trunc(readPositiveNumber(formData, "packageCount") ?? 1));

  const { error: itemError } = await supabase
    .from("shipment_items")
    .update({
      product_id: productId,
      product_snapshot_json: product ?? {},
      name: productName,
      part_number: readField(formData, "partNumber") || product?.part_number || null,
      quantity,
      quantity_confirmed: formData.get("quantityConfirmed") === "on",
      weight,
      weight_unit: weightUnit,
      weight_confirmed: formData.get("weightConfirmed") === "on",
      length: readPositiveNumber(formData, "length"),
      width: readPositiveNumber(formData, "width"),
      height: readPositiveNumber(formData, "height"),
      dimension_unit: dimensionUnit,
      package_type: packageType,
      lot_number: readField(formData, "lotNumber") || null,
      notes: readField(formData, "itemNotes") || null,
    })
    .eq("workspace_id", workspace.id)
    .eq("shipment_id", shipmentId)
    .eq("id", itemId);

  if (itemError) {
    logServerError({ action: "update_shipment_goods", error: itemError });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  if (packageId) {
    const { error: packageError } = await supabase
      .from("shipment_packages")
      .update({
        package_count: packageCount,
        package_type: packageType,
        weight,
        weight_unit: weightUnit,
        length: readPositiveNumber(formData, "length"),
        width: readPositiveNumber(formData, "width"),
        height: readPositiveNumber(formData, "height"),
        dimension_unit: dimensionUnit,
        stackable: formData.get("stackable") === "on",
        destination_label: readField(formData, "destinationLabel") || null,
        notes: readField(formData, "packageNotes") || null,
      })
      .eq("workspace_id", workspace.id)
      .eq("shipment_id", shipmentId)
      .eq("id", packageId);

    if (packageError) {
      logServerError({ action: "update_shipment_package", error: packageError });
      redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
    }
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipmentId,
    actor_user_id: user.id,
    action: "shipment_goods_package_updated",
    metadata_json: { itemId, packageId, productId, quantity, weight, weightUnit },
  });

  revalidatePath(`/${locale}/shipments/${shipmentId}`);
  revalidatePath(`/${locale}/shipments`);
  redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Marchandise mise à jour.")}`);
}

export async function updateShipmentTransportReferences(locale: Locale, formData: FormData) {
  const { workspace, user } = await getCurrentWorkspace();

  if (!workspace || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = readField(formData, "shipmentId");
  const transportId = readField(formData, "transportId");
  const carrierId = readOptionalId(formData, "carrierId");

  if (!shipmentId || !transportId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Transport introuvable.")}`);
  }

  const relationValidation = await validateShipmentDraftRelations({
    carrierId,
    contactId: null,
    destinationBusinessId: null,
    productId: null,
    siteId: null,
    workspaceId: workspace.id,
  });

  if (!relationValidation.valid) {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(relationValidation.message)}`);
  }

  const supabase = await createClient();
  const { data: carrier } = carrierId
    ? await supabase.from("carriers").select("*").eq("workspace_id", workspace.id).eq("id", carrierId).maybeSingle()
    : { data: null };

  const { error: shipmentError } = await supabase
    .from("shipments")
    .update({ carrier_id: carrierId })
    .eq("workspace_id", workspace.id)
    .eq("id", shipmentId);

  if (shipmentError) {
    logServerError({ action: "update_shipment_transport_carrier", error: shipmentError });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  const { error } = await supabase
    .from("shipment_transport")
    .update({
      carrier_id: carrierId,
      carrier_snapshot_json: carrier ?? {},
      pro_number: readField(formData, "proNumber") || null,
      bol_number: readField(formData, "bolNumber") || null,
      payment_term: readPaymentTerm(formData),
      needs_bol: formData.get("needsBol") === "on",
    })
    .eq("workspace_id", workspace.id)
    .eq("shipment_id", shipmentId)
    .eq("id", transportId);

  if (error) {
    logServerError({ action: "update_shipment_transport_references", error });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipmentId,
    actor_user_id: user.id,
    action: "shipment_transport_references_updated",
    metadata_json: {
      carrierId,
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
    logServerError({ action: "update_shipment_status", error });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
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
