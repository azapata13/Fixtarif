import { createClient } from "@/lib/supabase/server";
import { genericDataError, logServerError } from "@/lib/security/public-errors";

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export async function getShipmentsForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("id,reference,shipment_date,destination_country,reason,status,notes,destination_business_id,destination_site_id,destination_contact_id,carrier_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    logServerError({ action: "get_shipments_for_workspace", error });
    throw new Error(genericDataError());
  }

  const shipments = data ?? [];
  const shipmentIds = shipments.map((shipment) => shipment.id);
  const businessIds = uniqueIds(shipments.map((shipment) => shipment.destination_business_id));
  const siteIds = uniqueIds(shipments.map((shipment) => shipment.destination_site_id));
  const contactIds = uniqueIds(shipments.map((shipment) => shipment.destination_contact_id));
  const carrierIds = uniqueIds(shipments.map((shipment) => shipment.carrier_id));

  const [businessesResult, sitesResult, contactsResult, carriersResult, itemsResult, packagesResult] = await Promise.all([
    businessIds.length > 0 ? supabase.from("businesses").select("id,name").eq("workspace_id", workspaceId).in("id", businessIds) : Promise.resolve({ data: [] }),
    siteIds.length > 0 ? supabase.from("business_sites").select("id,name,city,region").eq("workspace_id", workspaceId).in("id", siteIds) : Promise.resolve({ data: [] }),
    contactIds.length > 0 ? supabase.from("contacts").select("id,name").eq("workspace_id", workspaceId).in("id", contactIds) : Promise.resolve({ data: [] }),
    carrierIds.length > 0 ? supabase.from("carriers").select("id,name").eq("workspace_id", workspaceId).in("id", carrierIds) : Promise.resolve({ data: [] }),
    shipmentIds.length > 0
      ? supabase.from("shipment_items").select("id,shipment_id,product_id,quantity,weight,weight_unit,quantity_confirmed,weight_confirmed,name").eq("workspace_id", workspaceId).in("shipment_id", shipmentIds)
      : Promise.resolve({ data: [] }),
    shipmentIds.length > 0
      ? supabase.from("shipment_packages").select("id,shipment_id,package_count,package_type").eq("workspace_id", workspaceId).in("shipment_id", shipmentIds)
      : Promise.resolve({ data: [] }),
  ]);
  const productIds = uniqueIds((itemsResult.data ?? []).map((item) => item.product_id));
  const customsResult =
    productIds.length > 0
      ? await supabase
          .from("product_customs")
          .select("id,product_id,hts_code,validation_status")
          .eq("workspace_id", workspaceId)
          .eq("destination_country", "US")
          .in("product_id", productIds)
      : { data: [] };

  const businessesById = new Map((businessesResult.data ?? []).map((business) => [business.id, business]));
  const sitesById = new Map((sitesResult.data ?? []).map((site) => [site.id, site]));
  const contactsById = new Map((contactsResult.data ?? []).map((contact) => [contact.id, contact]));
  const carriersById = new Map((carriersResult.data ?? []).map((carrier) => [carrier.id, carrier]));
  const customsByProductId = new Map((customsResult.data ?? []).map((customs) => [customs.product_id, customs]));

  return shipments.map((shipment) => ({
    ...shipment,
    businesses: shipment.destination_business_id ? businessesById.get(shipment.destination_business_id) ?? null : null,
    business_sites: shipment.destination_site_id ? sitesById.get(shipment.destination_site_id) ?? null : null,
    contacts: shipment.destination_contact_id ? contactsById.get(shipment.destination_contact_id) ?? null : null,
    carriers: shipment.carrier_id ? carriersById.get(shipment.carrier_id) ?? null : null,
    shipment_items: (itemsResult.data ?? []).filter((item) => item.shipment_id === shipment.id),
    shipment_packages: (packagesResult.data ?? []).filter((packageRow) => packageRow.shipment_id === shipment.id),
    product_customs: customsByProductId.get((itemsResult.data ?? []).find((item) => item.shipment_id === shipment.id)?.product_id ?? "") ?? null,
  }));
}

export async function getShipmentForWorkspace(workspaceId: string, shipmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("id,reference,shipment_date,destination_country,reason,status,notes,destination_business_id,destination_site_id,destination_contact_id,carrier_id")
    .eq("workspace_id", workspaceId)
    .eq("id", shipmentId)
    .maybeSingle();

  if (error) {
    logServerError({ action: "get_shipment_for_workspace", error });
    throw new Error(genericDataError());
  }

  if (!data) {
    return null;
  }

  const [businessResult, siteResult, contactResult, carrierResult, itemResult, packageResult, transportResult] = await Promise.all([
    data.destination_business_id
      ? supabase.from("businesses").select("name,email,phone").eq("workspace_id", workspaceId).eq("id", data.destination_business_id).maybeSingle()
      : Promise.resolve({ data: null }),
    data.destination_site_id
      ? supabase.from("business_sites").select("name,city,region,country,dock_info,appointment_required,call_before_minutes").eq("workspace_id", workspaceId).eq("id", data.destination_site_id).maybeSingle()
      : Promise.resolve({ data: null }),
    data.destination_contact_id
      ? supabase.from("contacts").select("name,email,phone,contact_type").eq("workspace_id", workspaceId).eq("id", data.destination_contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    data.carrier_id
      ? supabase.from("carriers").select("name,email,phone,default_provides_bol").eq("workspace_id", workspaceId).eq("id", data.carrier_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("shipment_items")
      .select("id,name,part_number,product_id,quantity,quantity_confirmed,weight,weight_unit,weight_confirmed,length,width,height,dimension_unit,package_type,lot_number,notes,product_snapshot_json")
      .eq("workspace_id", workspaceId)
      .eq("shipment_id", shipmentId),
    supabase
      .from("shipment_packages")
      .select("id,package_number,package_count,package_type,weight,weight_unit,length,width,height,dimension_unit,stackable,destination_label,notes")
      .eq("workspace_id", workspaceId)
      .eq("shipment_id", shipmentId),
    supabase
      .from("shipment_transport")
      .select("id,carrier_id,payment_term,needs_bol,pro_number,bol_number")
      .eq("workspace_id", workspaceId)
      .eq("shipment_id", shipmentId),
  ]);

  return {
    ...data,
    businesses: businessResult.data,
    business_sites: siteResult.data,
    contacts: contactResult.data,
    carriers: carrierResult.data,
    shipment_items: itemResult.data ?? [],
    shipment_packages: packageResult.data ?? [],
    shipment_transport: transportResult.data ?? [],
  };
}

export async function getNextShipmentReference(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipments")
    .select("reference")
    .eq("workspace_id", workspaceId)
    .like("reference", "ST-%");

  if (error) {
    logServerError({ action: "get_next_shipment_reference", error });
    throw new Error(genericDataError());
  }

  const maxNumber = (data ?? []).reduce((max, shipment) => {
    const match = /^ST-(\d+)$/.exec(shipment.reference);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `ST-${String(maxNumber + 1).padStart(4, "0")}`;
}
