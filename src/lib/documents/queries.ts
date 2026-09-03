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
      generatedDocuments: [],
      schemaReady: false,
      sourceDocuments: [],
    };
  }

  return {
    generatedDocuments: generatedResult.data ?? [],
    schemaReady: true,
    sourceDocuments: sourceResult.data ?? [],
  };
}
