import { createClient } from "@/lib/supabase/server";

export async function getBrokersForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brokers")
    .select("id,name,contact_name,email,phone,address,is_default_usa,notes,active")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
