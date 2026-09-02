import { createClient } from "@/lib/supabase/server";

export async function getShipmentsForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("id,reference,shipment_date,destination_country,reason,status,notes,businesses(name),carriers(name),shipment_items(id,quantity,weight,weight_unit,quantity_confirmed,weight_confirmed,name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
