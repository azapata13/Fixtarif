import { createClient } from "@/lib/supabase/server";

export async function getShipmentsForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("id,reference,shipment_date,destination_country,reason,status,notes,businesses(name),business_sites(name,city,region),contacts(name),carriers(name),shipment_items(id,quantity,weight,weight_unit,quantity_confirmed,weight_confirmed,name),shipment_packages(id,package_count,package_type)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getShipmentForWorkspace(workspaceId: string, shipmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select(
      "id,reference,shipment_date,destination_country,reason,status,notes,businesses(name,email,phone),business_sites(name,city,region,country,dock_info,appointment_required,call_before_minutes),contacts(name,email,phone,contact_type),carriers(name,email,phone,default_provides_bol),shipment_items(id,name,part_number,quantity,quantity_confirmed,weight,weight_unit,weight_confirmed,package_type,lot_number,product_snapshot_json),shipment_packages(id,package_number,package_count,package_type,weight,weight_unit,length,width,height,dimension_unit,stackable,destination_label),shipment_transport(id,payment_term,needs_bol,pro_number,bol_number)",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", shipmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getNextShipmentReference(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("reference")
    .eq("workspace_id", workspaceId)
    .like("reference", "ST-%");

  if (error) {
    throw new Error(error.message);
  }

  const maxNumber = (data ?? []).reduce((max, shipment) => {
    const match = /^ST-(\d+)$/.exec(shipment.reference);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `ST-${String(maxNumber + 1).padStart(4, "0")}`;
}
