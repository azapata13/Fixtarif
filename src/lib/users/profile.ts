import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function readMetadataString(user: User, keys: string[]) {
  for (const key of keys) {
    const value = user.user_metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export async function syncCurrentUserProfile(user: User) {
  if (!user.email) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      email: user.email.toLowerCase(),
      full_name: readMetadataString(user, ["full_name", "name"]),
      avatar_url: readMetadataString(user, ["avatar_url", "picture"]),
    },
    { onConflict: "user_id" },
  ).then(() => null);
}
