"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createWorkspace(locale: Locale, formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const workspaceName = field(formData, "workspaceName");
  const legalName = field(formData, "legalName");

  if (!workspaceName || !legalName) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent("Workspace and legal name are required.")}`);
  }

  const { data: workspaceId, error: workspaceError } = await supabase.rpc("create_workspace_with_owner", {
    workspace_name: workspaceName,
  });

  if (workspaceError || !workspaceId) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent(workspaceError?.message ?? "Workspace creation failed.")}`);
  }

  const { error: profileError } = await supabase.from("company_profiles").insert({
    workspace_id: workspaceId,
    legal_name: legalName,
    language: locale,
  });

  if (profileError) {
    redirect(`/${locale}/onboarding?message=${encodeURIComponent(profileError.message)}`);
  }

  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/dashboard`);
}
