import { createClient } from "@/lib/supabase/server";

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
        business_sites(id, name, city, region, country),
        contacts(id, name, email, phone, contact_type)
      `,
    )
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
