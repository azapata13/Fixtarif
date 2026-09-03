import { createClient } from "@/lib/supabase/server";
import { genericDataError, logServerError } from "@/lib/security/public-errors";

export async function getCarriersForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carriers")
    .select("id,name,carrier_type,email,phone,default_provides_bol,notes,active")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    logServerError({ action: "get_carriers_for_workspace", error });
    throw new Error(genericDataError());
  }

  return data;
}
