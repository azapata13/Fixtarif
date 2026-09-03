import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((file) => !file.startsWith("package-lock.json"));

const forbiddenSecretPatterns = [
  { label: "Supabase secret key", pattern: /sb_secret_[A-Za-z0-9_-]+/ },
  { label: "Google OAuth secret", pattern: /GOCSPX-[A-Za-z0-9_-]+/ },
  { label: "Private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { label: "Serialized client secret", pattern: /"client_secret"\s*:\s*"[^"]+"/ },
];

const requiredHeaderTokens = [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
];

const findings = [];

for (const file of trackedFiles) {
  const text = readFileSync(file, "utf8");

  for (const { label, pattern } of forbiddenSecretPatterns) {
    if (pattern.test(text)) {
      findings.push(`${label} appears in ${file}`);
    }
  }

  if (file.startsWith("src/") && /message=\$\{encodeURIComponent\([^)]*error(?:\?|\.)?\.message/.test(text)) {
    findings.push(`Raw server error message may be exposed in ${file}`);
  }
}

const nextConfig = readFileSync("next.config.ts", "utf8");
for (const token of requiredHeaderTokens) {
  if (!nextConfig.includes(token)) {
    findings.push(`Missing security header in next.config.ts: ${token}`);
  }
}

if (findings.length > 0) {
  console.error(JSON.stringify({ pass: false, findings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, checkedFiles: trackedFiles.length }, null, 2));
