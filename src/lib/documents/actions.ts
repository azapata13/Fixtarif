"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

const SOURCE_BUCKET = "source-documents";
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
