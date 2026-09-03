import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

type DownloadDocumentRouteProps = {
  params: Promise<{ documentId: string }>;
};

export async function GET(_request: Request, { params }: DownloadDocumentRouteProps) {
  const { documentId } = await params;
  const { workspace } = await getCurrentWorkspace();

  if (!workspace) {
    return NextResponse.redirect(new URL("/fr/login", _request.url));
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("generated_documents")
    .select("storage_bucket,storage_path")
    .eq("workspace_id", workspace.id)
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    return new NextResponse("Document not found", { status: 404 });
  }

  const { data, error } = await supabase.storage.from(document.storage_bucket).createSignedUrl(document.storage_path, 60);

  if (error || !data?.signedUrl) {
    return new NextResponse("Document unavailable", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
