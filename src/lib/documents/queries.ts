import { genericDataError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";

export async function getDocumentOverviewForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const [sourceResult, generatedResult] = await Promise.all([
    supabase
      .from("source_documents")
      .select("id,original_filename,mime_type,validation_status,created_at,shipment_id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("generated_documents")
      .select("id,document_type,template_version,validation_status,generated_at,shipment_id")
      .eq("workspace_id", workspaceId)
      .order("generated_at", { ascending: false })
      .limit(8),
  ]);

  if (sourceResult.error || generatedResult.error) {
    logServerError({
      action: "get_document_overview_for_workspace",
      error: sourceResult.error ?? generatedResult.error ?? genericDataError(),
    });

    return {
      documentExtractions: [],
      generatedDocuments: [],
      schemaReady: false,
      sourceDocuments: [],
    };
  }

  const sourceDocumentIds = (sourceResult.data ?? []).map((document) => document.id);
  const extractionsResult = sourceDocumentIds.length
    ? await supabase
        .from("document_extractions")
        .select("id,source_document_id,normalized_result_json,validation_status,confirmed_at,created_at")
        .eq("workspace_id", workspaceId)
        .in("source_document_id", sourceDocumentIds)
    : { data: [], error: null };

  if (extractionsResult.error) {
    logServerError({ action: "get_document_extractions_for_overview", error: extractionsResult.error });
  }

  return {
    documentExtractions: extractionsResult.data ?? [],
    generatedDocuments: generatedResult.data ?? [],
    schemaReady: true,
    sourceDocuments: sourceResult.data ?? [],
  };
}

export async function getGeneratedDocumentsForShipment(workspaceId: string, shipmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("generated_documents")
    .select("id,document_type,template_version,validation_status,generated_at")
    .eq("workspace_id", workspaceId)
    .eq("shipment_id", shipmentId)
    .order("generated_at", { ascending: false });

  if (error) {
    logServerError({ action: "get_generated_documents_for_shipment", error });
    return [];
  }

  return data ?? [];
}

export async function getSourceDocumentsForShipment(workspaceId: string, shipmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("source_documents")
    .select("id,original_filename,mime_type,validation_status,created_at")
    .eq("workspace_id", workspaceId)
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false });

  if (error) {
    logServerError({ action: "get_source_documents_for_shipment", error });
    return [];
  }

  return data ?? [];
}
