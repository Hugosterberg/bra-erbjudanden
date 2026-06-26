import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function loadEnvLocal() {
  if (!existsSync(".env.local")) {
    return;
  }

  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=");

    if (key) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const args = process.argv.slice(2);

if (
  ["db", "migration"].includes(args[0]) &&
  !process.env.SUPABASE_DB_PASSWORD?.trim()
) {
  console.log(
    "Missing SUPABASE_DB_PASSWORD in .env.local. Add your Supabase database password, then run the command again.",
  );
  process.exit(1);
}

const result = spawnSync("npx", ["supabase", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.log(`Failed to start Supabase CLI: ${result.error.message}`);
}

process.exit(result.status ?? 1);
