import { createClient } from "@/lib/supabase/server";

export async function getProductsForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,part_number,description_fr,description_en,weight,weight_unit,length,width,height,dimension_unit,default_package_type,stackable,default_value,currency,active,notes",
    )
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
