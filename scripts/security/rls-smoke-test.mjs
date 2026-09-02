import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const emailSuffix = Date.now();
const ownerEmail = `rls-owner-${emailSuffix}@fixtarif.test`;
const outsiderEmail = `rls-outsider-${emailSuffix}@fixtarif.test`;
const password = `Fixtarif-test-${emailSuffix}!`;

let ownerUserId;
let outsiderUserId;
let workspaceId;

async function createConfirmedUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  return data.user.id;
}

async function signIn(email) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return client;
}

async function run() {
  try {
    ownerUserId = await createConfirmedUser(ownerEmail);
    outsiderUserId = await createConfirmedUser(outsiderEmail);

    const ownerClient = await signIn(ownerEmail);
    const outsiderClient = await signIn(outsiderEmail);

    const { data: createdWorkspaceId, error: workspaceError } = await ownerClient.rpc("create_workspace_with_owner", {
      workspace_name: "RLS Test Workspace",
    });

    if (workspaceError) {
      throw workspaceError;
    }

    workspaceId = createdWorkspaceId;

    const { error: profileError } = await ownerClient.from("company_profiles").insert({
      workspace_id: workspaceId,
      legal_name: "RLS Test Company",
      language: "fr",
    });

    if (profileError) {
      throw profileError;
    }

    const { data: ownerRows, error: ownerReadError } = await ownerClient.from("workspaces").select("id,name");

    if (ownerReadError) {
      throw ownerReadError;
    }

    const { data: outsiderRows, error: outsiderReadError } = await outsiderClient.from("workspaces").select("id,name");

    if (outsiderReadError) {
      throw outsiderReadError;
    }

    const { data: outsiderProfiles, error: outsiderProfileError } = await outsiderClient
      .from("company_profiles")
      .select("id,workspace_id,legal_name");

    if (outsiderProfileError) {
      throw outsiderProfileError;
    }

    const ownerCanReadOwnWorkspace = ownerRows?.some((row) => row.id === workspaceId) ?? false;
    const outsiderCanReadWorkspace = (outsiderRows ?? []).some((row) => row.id === workspaceId);
    const outsiderCanReadCompanyProfile = (outsiderProfiles ?? []).some((row) => row.workspace_id === workspaceId);
    const pass = ownerCanReadOwnWorkspace && !outsiderCanReadWorkspace && !outsiderCanReadCompanyProfile;

    console.log(
      JSON.stringify(
        {
          pass,
          ownerCanReadOwnWorkspace,
          outsiderWorkspaceRows: outsiderRows?.length ?? 0,
          outsiderCompanyProfileRows: outsiderProfiles?.length ?? 0,
        },
        null,
        2,
      ),
    );

    if (!pass) {
      process.exitCode = 1;
    }
  } finally {
    if (workspaceId) {
      await admin.from("workspaces").delete().eq("id", workspaceId);
    }

    if (ownerUserId) {
      await admin.auth.admin.deleteUser(ownerUserId);
    }

    if (outsiderUserId) {
      await admin.auth.admin.deleteUser(outsiderUserId);
    }
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
