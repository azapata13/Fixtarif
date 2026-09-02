import { createClient } from "@/lib/supabase/server";

export async function getCarriersForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carriers")
    .select("id,name,carrier_type,email,phone,default_provides_bol,notes,active")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
