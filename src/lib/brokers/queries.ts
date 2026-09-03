import { createClient } from "@/lib/supabase/server";
import { genericDataError, logServerError } from "@/lib/security/public-errors";

export async function getBrokersForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brokers")
    .select("id,name,contact_name,email,phone,address,is_default_usa,notes,active")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    logServerError({ action: "get_brokers_for_workspace", error });
    throw new Error(genericDataError());
  }

  return data;
}
