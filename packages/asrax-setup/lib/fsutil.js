import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function asraxHome() {
  const raw = (process.env.ASRAX_HOME || "").trim();
  if (raw) return path.resolve(raw);
  return path.join(os.homedir(), ".asrax");
}

export function cursorMcpPath() {
  return path.join(os.homedir(), ".cursor", "mcp.json");
}

export function credentialsTemplate() {
  return fs.readFileSync(
    path.join(__dirname, "..", "templates", "credentials.env.example"),
    "utf8"
  );
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeIfMissing(filePath, contents) {
  if (fs.existsSync(filePath)) return { wrote: false, path: filePath };
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
  return { wrote: true, path: filePath };
}

export function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/** Merge asrax npx entry into Cursor mcp.json; preserve other servers. */
export function mergeCursorAsrax(mcpPath = cursorMcpPath()) {
  const data = readJson(mcpPath);
  if (!data.mcpServers || typeof data.mcpServers !== "object") {
    data.mcpServers = {};
  }
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  // Until @asrax/mcp is on npmjs, install from GitHub Release tarball.
  const spec =
    (process.env.AM_MCP_ASRAX_NPX_SPEC || "").trim() ||
    "https://github.com/AM-Portfolio/asrax-npm/releases/download/v0.1.0/asrax-mcp-0.1.0.tgz";
  data.mcpServers.asrax = {
    command: npx,
    args: ["-y", spec],
  };
  writeJson(mcpPath, data);
  return mcpPath;
}
