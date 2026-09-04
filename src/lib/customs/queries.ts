import { genericDataError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";

export async function getProductCustomsForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_customs")
    .select("id,product_id,destination_country,hs_code,hts_code,official_description,general_rate,special_rate,other_rate,units,validation_status,last_checked_at,source_name")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    logServerError({ action: "get_product_customs_for_workspace", error });
    throw new Error(genericDataError());
  }

  return data ?? [];
}
