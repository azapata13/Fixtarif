import { createClient } from "@/lib/supabase/server";
import { genericDataError, logServerError } from "@/lib/security/public-errors";

export async function getBusinessesForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
        id,
        name,
        email,
        phone,
        roles,
        notes,
        business_sites(id, name, city, region, country, dock_info, appointment_required, call_before_minutes),
        contacts(id, name, email, phone, contact_type)
      `,
    )
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    logServerError({ action: "get_businesses_for_workspace", error });
    throw new Error(genericDataError());
  }

  return data;
}
