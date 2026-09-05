import type { NextRequest } from "next/server";

function configuredPublicOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? (process.env.NODE_ENV === "production" ? "https://app.fixtarif.ca" : "http://localhost:3000");
}

function hostnameFromUrlOrHost(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value.split(":")[0];
  }
}

export function getAuthRedirectOrigin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  if (!host) {
    return configuredPublicOrigin();
  }

  const hostname = hostnameFromUrlOrHost(host);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}://${host}`;
  }

  const configured = configuredPublicOrigin();

  if (hostname.endsWith(".netlify.app")) {
    return configured;
  }

  const allowedHostnames = new Set(
    [configured, process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_MARKETING_URL, "app.fixtarif.ca", "fixtarif.ca", "fixtarif.netlify.app"]
      .filter(Boolean)
      .map((value) => hostnameFromUrlOrHost(value as string)),
  );

  if (allowedHostnames.has(hostname)) {
    return `${protocol}://${host}`;
  }

  return configured;
}
