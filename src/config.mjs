import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function parseJson(raw, source) {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`${source} is empty`);
  }

  try {
    return JSON.parse(trimmed);
  } catch (err) {
    throw new Error(`Invalid JSON in ${source}: ${err.message}`);
  }
}

function readConfigFile() {
  const configPath = join(ROOT, "config.json");
  if (!existsSync(configPath)) {
    return null;
  }
  return parseJson(readFileSync(configPath, "utf8"), "config.json");
}

function normalizeConfig(raw, source) {
  if (Array.isArray(raw)) {
    return { targets: raw };
  }

  if (!raw || typeof raw !== "object") {
    throw new Error(`${source} must be a JSON object or targets array`);
  }

  const { targets } = raw;

  if (!Array.isArray(targets)) {
    throw new Error(`${source} must include a "targets" array`);
  }

  return { targets };
}

/**
 * Load config from REPO_SECRET (full config.json), legacy PING_TARGETS (targets only),
 * or config.json in the project root.
 */
export function loadConfig() {
  const envConfig = process.env.REPO_SECRET?.trim();
  if (envConfig) {
    return normalizeConfig(parseJson(envConfig, "REPO_SECRET"), "REPO_SECRET");
  }

  const legacyTargets = process.env.PING_TARGETS?.trim();
  if (legacyTargets) {
    console.warn("PING_TARGETS is deprecated — paste full config.json into REPO_SECRET instead.");
    return normalizeConfig(parseJson(legacyTargets, "PING_TARGETS"), "PING_TARGETS");
  }

  const fileConfig = readConfigFile();
  if (fileConfig) {
    return normalizeConfig(fileConfig, "config.json");
  }

  throw new Error(
    "No config found. Add config.json locally, or set REPO_SECRET to your full config.json contents."
  );
}
