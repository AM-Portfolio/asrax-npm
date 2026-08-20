/**
 * Load ~/.asrax credentials into process.env (do not overwrite non-empty env).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function asraxHome() {
  const raw = (process.env.ASRAX_HOME || "").trim();
  if (raw) return path.resolve(raw);
  return path.join(os.homedir(), ".asrax");
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  } catch {
    return {};
  }
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const k = trimmed.slice(0, i).trim();
    let v = trimmed.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (k && v) out[k] = v;
  }
  return out;
}

/** Merge vault -> credentials.d -> credentials.env into process.env (env wins). */
export function loadCreds(home = asraxHome()) {
  const merged = {
    ...parseEnvFile(path.join(home, "credentials.vault.env")),
  };
  const overlayDir = path.join(home, "credentials.d");
  if (fs.existsSync(overlayDir)) {
    for (const name of fs.readdirSync(overlayDir).sort()) {
      if (!name.endsWith(".env")) continue;
      Object.assign(merged, parseEnvFile(path.join(overlayDir, name)));
    }
  }
  Object.assign(merged, parseEnvFile(path.join(home, "credentials.env")));
  for (const [k, v] of Object.entries(merged)) {
    const existing = process.env[k];
    if (existing != null && String(existing).trim() !== "") continue;
    process.env[k] = v;
  }
  return merged;
}
