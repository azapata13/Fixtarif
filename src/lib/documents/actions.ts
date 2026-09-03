"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createPackingSlipPdf } from "@/lib/documents/pdf";
import { getShipmentForWorkspace } from "@/lib/shipments/queries";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

const SOURCE_BUCKET = "source-documents";
const GENERATED_BUCKET = "generated-documents";
const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_SOURCE_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

function safeStorageFilename(filename: string) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function uploadSourceDocument(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const file = formData.get("sourceDocument");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/${locale}/documents?message=${encodeURIComponent("Choisis un PDF ou une image avant d'importer.")}`);
  }

  if (file.size > MAX_SOURCE_FILE_SIZE || !ALLOWED_SOURCE_MIME_TYPES.has(file.type)) {
    redirect(`/${locale}/documents?message=${encodeURIComponent("Format non accepté. Utilise PDF, PNG, JPG ou WebP, maximum 10 Mo.")}`);
  }

  const supabase = await createClient();
  const filename = safeStorageFilename(file.name) || "document-source";
  const storagePath = `${workspace.id}/${crypto.randomUUID()}-${filename}`;

  const { error: uploadError } = await supabase.storage.from(SOURCE_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    logServerError({ action: "upload_source_document_storage", error: uploadError });
    redirect(`/${locale}/documents?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  const { error: documentError } = await supabase.from("source_documents").insert({
    workspace_id: workspace.id,
    storage_bucket: SOURCE_BUCKET,
    storage_path: storagePath,
    mime_type: file.type,
    original_filename: file.name,
    uploaded_by: user.id,
    validation_status: "draft",
  });

  if (documentError) {
    await supabase.storage.from(SOURCE_BUCKET).remove([storagePath]);
    logServerError({ action: "upload_source_document_metadata", error: documentError });
    redirect(`/${locale}/documents?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "source_document_uploaded",
    metadata_json: { mime_type: file.type, storage_bucket: SOURCE_BUCKET },
  });

  revalidatePath(`/${locale}/documents`);
  redirect(`/${locale}/documents?message=${encodeURIComponent("Document source importé de façon privée.")}`);
}

export async function generatePackingSlipDraft(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const shipmentId = formData.get("shipmentId");

  if (typeof shipmentId !== "string" || !shipmentId) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  const shipment = await getShipmentForWorkspace(workspace.id, shipmentId);

  if (!shipment) {
    redirect(`/${locale}/shipments?message=${encodeURIComponent("Expédition introuvable.")}`);
  }

  if (shipment.status !== "ready") {
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Marquez l'expédition prête avant de générer un PDF.")}`);
  }

  const item = Array.isArray(shipment.shipment_items) ? shipment.shipment_items[0] : shipment.shipment_items;
  const packageRow = Array.isArray(shipment.shipment_packages) ? shipment.shipment_packages[0] : shipment.shipment_packages;
  const destination = Array.isArray(shipment.businesses) ? shipment.businesses[0] : shipment.businesses;
  const site = Array.isArray(shipment.business_sites) ? shipment.business_sites[0] : shipment.business_sites;
  const contact = Array.isArray(shipment.contacts) ? shipment.contacts[0] : shipment.contacts;
  const carrier = Array.isArray(shipment.carriers) ? shipment.carriers[0] : shipment.carriers;
  const pdf = createPackingSlipPdf({
    carrierName: carrier?.name ?? null,
    contactEmail: contact?.email ?? null,
    contactName: contact?.name ?? null,
    contactPhone: contact?.phone ?? null,
    destinationCountry: shipment.destination_country,
    destinationName: destination?.name ?? null,
    itemName: item?.name ?? null,
    packageCount: packageRow?.package_count ?? null,
    packageType: packageRow?.package_type ?? null,
    partNumber: item?.part_number ?? null,
    quantity: item?.quantity ?? null,
    reference: shipment.reference,
    shipmentDate: shipment.shipment_date,
    siteLabel: site ? [site.name, site.city, site.region, site.country].filter(Boolean).join(" - ") : null,
    weightLabel: item ? `${item.weight} ${item.weight_unit}` : null,
  });

  const supabase = await createClient();
  const storagePath = `${workspace.id}/${shipment.id}/${crypto.randomUUID()}-packing-slip-draft.pdf`;
  const { error: uploadError } = await supabase.storage.from(GENERATED_BUCKET).upload(storagePath, pdf, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false,
  });

  if (uploadError) {
    logServerError({ action: "generate_packing_slip_storage", error: uploadError });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  const { error: documentError } = await supabase.from("generated_documents").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    document_type: "packing_slip",
    template_version: "draft-v1",
    storage_bucket: GENERATED_BUCKET,
    storage_path: storagePath,
    generated_by: user.id,
    validation_status: "draft",
    metadata_json: { destination_country: shipment.destination_country, source: "manual_validation" },
  });

  if (documentError) {
    await supabase.storage.from(GENERATED_BUCKET).remove([storagePath]);
    logServerError({ action: "generate_packing_slip_metadata", error: documentError });
    redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    shipment_id: shipment.id,
    actor_user_id: user.id,
    action: "packing_slip_draft_generated",
    metadata_json: { storage_bucket: GENERATED_BUCKET },
  });

  revalidatePath(`/${locale}/shipments/${shipmentId}`);
  revalidatePath(`/${locale}/documents`);
  redirect(`/${locale}/shipments/${shipmentId}?message=${encodeURIComponent("Packing slip PDF brouillon généré en privé.")}`);
}
