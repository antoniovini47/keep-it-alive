/**
 * Optional always-on mode: HTTP server + ping every N minutes.
 * Note: free tiers (Render, Railway) may sleep this process too.
 * Prefer GitHub Actions (.github/workflows/keepalive.yml) for reliability.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const pingScript = join(__dirname, "ping.mjs");

const PORT = Number(process.env.PORT) || 3000;
const intervalSeconds = Number(process.env.PING_INTERVAL_SECONDS) || 600;
const INTERVAL_MS = intervalSeconds * 1000;

function runPing() {
  const child = spawn(process.execPath, [pingScript], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("error", (err) => console.error("Ping spawn error:", err));
}

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      service: "keep-it-alive",
      intervalSeconds,
      uptime: process.uptime(),
    })
  );
});

server.listen(PORT, () => {
  console.log(`Keepalive server on :${PORT}, pinging every ${intervalSeconds}s`);
  runPing();
  setInterval(runPing, INTERVAL_MS);
});
