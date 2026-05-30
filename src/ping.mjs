/**
 * Pings all configured targets and logs results.
 * Config: PING_TARGETS env (JSON) or config.json in project root.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadTargets() {
  if (process.env.PING_TARGETS) {
    return JSON.parse(process.env.PING_TARGETS);
  }

  const configPath = join(root, "config.json");
  if (existsSync(configPath)) {
    const raw = JSON.parse(readFileSync(configPath, "utf8"));
    return raw.targets ?? raw;
  }

  throw new Error(
    "No targets found. Copy config.example.json to config.json or set PING_TARGETS."
  );
}

async function pingOne(target) {
  const { name, url, method = "GET", headers = {}, body } = target;
  const started = Date.now();

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  const ms = Date.now() - started;
  const ok = response.ok;

  return {
    name,
    url,
    status: response.status,
    ok,
    ms,
  };
}

async function main() {
  const targets = loadTargets();

  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("targets must be a non-empty array");
  }

  console.log(`[${new Date().toISOString()}] Pinging ${targets.length} target(s)...`);

  const results = await Promise.allSettled(targets.map(pingOne));
  let failures = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const { name, status, ok, ms } = result.value;
      const label = ok ? "OK" : "WARN";
      console.log(`  ${label} ${name}: HTTP ${status} (${ms}ms)`);
      if (!ok) failures++;
    } else {
      failures++;
      const target = targets[i];
      console.error(`  FAIL ${target?.name ?? "unknown"}: ${result.reason?.message ?? result.reason}`);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
    console.error(`\n${failures} target(s) failed.`);
  } else {
    console.log("\nAll targets responded.");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
