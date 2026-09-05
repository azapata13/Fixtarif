"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createPackingSlipPdf } from "@/lib/documents/pdf";
import { getShipmentForWorkspace } from "@/lib/shipments/queries";
import { createClient } from "@/lib/supabase/server";
import type { ExtractionStatus, ValidationStatus } from "@/lib/supabase/types";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

const SOURCE_BUCKET = "source-documents";
const GENERATED_BUCKET = "generated-documents";
const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_SOURCE_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

const extractionStatusToDocumentStatus: Record<ExtractionStatus, ValidationStatus> = {
  confirmed: "validated",
  extracted: "needs_review",
  needs_review: "needs_review",
  pending: "draft",
  rejected: "rejected",
};

function safeStorageFilename(filename: string) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function buildManualReviewExtraction(filename: string, mimeType: string) {
  const basename = filename.replace(/\.[^.]+$/, "");
  const tokens = basename
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const possibleReference = tokens.find((token) => /\d{3,}/.test(token)) ?? null;

  return {
    raw: {
      source: "manual_review_placeholder",
      originalFilename: filename,
      mimeType,
      extractedAt: new Date().toISOString(),
    },
    normalized: {
      confidence: "manual_review_required",
      destinationName: null,
      productName: tokens.length ? tokens.slice(0, 5).join(" ") : null,
      quantity: null,
      shipmentReference: possibleReference,
      weight: null,
      missingFields: ["destination", "site", "contact", "product", "quantity", "weight", "carrier"],
      nextAction: "review_before_creating_or_updating_shipment",
    },
  };
}

function getExtractionStatus(value: FormDataEntryValue | null): ExtractionStatus | null {
  if (value === "confirmed" || value === "needs_review" || value === "rejected") {
    return value;
  }

  return null;
}

export async function uploadSourceDocument(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const file = formData.get("sourceDocument");
  const shipmentId = formData.get("shipmentId");
  const linkedShipmentId = typeof shipmentId === "string" && shipmentId ? shipmentId : null;

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${linkedShipmentId ? `/${locale}/shipments/${linkedShipmentId}` : `/${locale}/documents`}?message=${encodeURIComponent("Choisis un PDF ou une image avant d'importer.")}`);
  }

  if (file.size > MAX_SOURCE_FILE_SIZE || !ALLOWED_SOURCE_MIME_TYPES.has(file.type)) {
    redirect(`${linkedShipmentId ? `/${locale}/shipments/${linkedShipmentId}` : `/${locale}/documents`}?message=${encodeURIComponent("Format non accepté. Utilise PDF, PNG, JPG ou WebP, maximum 10 Mo.")}`);
  }

  const supabase = await createClient();

  if (linkedShipmentId) {
    const shipment = await getShipmentForWorkspace(workspace.id, linkedShipmentId);

    if (!shipment) {
      redirect(`/${locale}/documents?message=${encodeURIComponent("Expédition introuvable.")}`);
    }
  }

  const filename = safeStorageFilename(file.name) || "document-source";
  const storagePath = `${workspace.id}/${linkedShipmentId ? `${linkedShipmentId}/` : ""}${crypto.randomUUID()}-${filename}`;

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
    shipment_id: linkedShipmentId,
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
    shipment_id: linkedShipmentId,
    actor_user_id: user.id,
    action: "source_document_uploaded",
    metadata_json: { mime_type: file.type, storage_bucket: SOURCE_BUCKET, linkedShipmentId },
  });

  revalidatePath(`/${locale}/documents`);
  if (linkedShipmentId) {
    revalidatePath(`/${locale}/shipments/${linkedShipmentId}`);
    redirect(`/${locale}/shipments/${linkedShipmentId}?message=${encodeURIComponent("Document source ajouté à l'expédition.")}`);
  }

  redirect(`/${locale}/documents?message=${encodeURIComponent("Document source importé de façon privée.")}`);
}

export async function prepareSourceDocumentExtraction(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const sourceDocumentId = formData.get("sourceDocumentId");

  if (typeof sourceDocumentId !== "string" || !sourceDocumentId) {
    redirect(`/${locale}/documents?message=${encodeURIComponent("Document source introuvable.")}`);
  }

  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("source_documents")
    .select("id,workspace_id,mime_type,original_filename")
    .eq("workspace_id", workspace.id)
    .eq("id", sourceDocumentId)
    .single();

  if (documentError || !document) {
    logServerError({ action: "prepare_document_extraction_lookup", error: documentError ?? new Error("Missing source document") });
    redirect(`/${locale}/documents?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  const extraction = buildManualReviewExtraction(document.original_filename, document.mime_type);
  const { error: extractionError } = await supabase.from("document_extractions").upsert(
    {
      workspace_id: workspace.id,
      source_document_id: document.id,
      raw_result_json: extraction.raw,
      normalized_result_json: extraction.normalized,
      validation_status: "needs_review",
      confirmed_by: null,
      confirmed_at: null,
    },
    { onConflict: "source_document_id" },
  );

  if (extractionError) {
    logServerError({ action: "prepare_document_extraction_upsert", error: extractionError });
    redirect(`/${locale}/documents?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("source_documents").update({ validation_status: "needs_review" }).eq("workspace_id", workspace.id).eq("id", document.id);
  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "source_document_extraction_prepared",
    metadata_json: { sourceDocumentId: document.id, mode: "manual_review_placeholder" },
  });

  revalidatePath(`/${locale}/documents`);
  redirect(`/${locale}/documents?message=${encodeURIComponent("Pré-analyse créée. Révision humaine requise.")}`);
}

export async function updateDocumentExtractionStatus(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  const extractionId = formData.get("extractionId");
  const status = getExtractionStatus(formData.get("status"));

  if (typeof extractionId !== "string" || !extractionId || !status) {
    redirect(`/${locale}/documents?message=${encodeURIComponent("Statut d'extraction invalide.")}`);
  }

  const supabase = await createClient();
  const { data: extraction, error: lookupError } = await supabase
    .from("document_extractions")
    .select("id,source_document_id")
    .eq("workspace_id", workspace.id)
    .eq("id", extractionId)
    .single();

  if (lookupError || !extraction) {
    logServerError({ action: "update_document_extraction_lookup", error: lookupError ?? new Error("Missing extraction") });
    redirect(`/${locale}/documents?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  const { error: updateError } = await supabase
    .from("document_extractions")
    .update({
      validation_status: status,
      confirmed_by: status === "confirmed" ? user.id : null,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", extraction.id);

  if (updateError) {
    logServerError({ action: "update_document_extraction_status", error: updateError });
    redirect(`/${locale}/documents?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase
    .from("source_documents")
    .update({ validation_status: extractionStatusToDocumentStatus[status] })
    .eq("workspace_id", workspace.id)
    .eq("id", extraction.source_document_id);

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "source_document_extraction_status_updated",
    metadata_json: { extractionId: extraction.id, status },
  });

  revalidatePath(`/${locale}/documents`);
  redirect(`/${locale}/documents?message=${encodeURIComponent(status === "confirmed" ? "Extraction confirmée." : status === "rejected" ? "Extraction rejetée." : "Extraction remise à vérifier.")}`);
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
