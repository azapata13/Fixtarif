"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createClient() {
  const { supabaseUrl, anonKey } = getSupabasePublicEnv();
  return createBrowserClient<Database>(supabaseUrl, anonKey);
}
