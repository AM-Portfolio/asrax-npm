#!/usr/bin/env node
/**
 * @asrax/setup — bootstrap ~/.asrax + Cursor MCP (no amctl clone).
 *
 * Usage:
 *   npx @asrax/setup init
 *   npx @asrax/setup init --force-creds
 */
import process from "node:process";
import {
  asraxHome,
  credentialsTemplate,
  ensureDir,
  mergeCursorAsrax,
  writeIfMissing,
} from "../lib/fsutil.js";
import path from "node:path";
import fs from "node:fs";

function printHelp() {
  console.log(`Usage:
  asrax-setup init [--force-creds]

Creates ~/.asrax, credentials.env template, and merges Cursor mcp.json
with npx @asrax/mcp. Does not print or overwrite existing secrets unless
--force-creds is set.
`);
}

function init({ forceCreds = false } = {}) {
  const home = asraxHome();
  ensureDir(home);
  ensureDir(path.join(home, "credentials.d"));
  ensureDir(path.join(home, "secrets"));
  ensureDir(path.join(home, "bin"));

  const credsPath = path.join(home, "credentials.env");
  if (forceCreds || !fs.existsSync(credsPath)) {
    fs.writeFileSync(credsPath, credentialsTemplate(), "utf8");
    console.log(`Wrote ${credsPath}`);
  } else {
    console.log(`Kept existing ${credsPath}`);
  }

  const mcpPath = mergeCursorAsrax();
  console.log(`Merged asrax MCP into ${mcpPath}`);
  console.log("");
  console.log("Next:");
  console.log(`  1. Edit ${credsPath} (GitHub PAT + AM_MCP_CLIENT_* or ASRAX_KEY_*)`);
  console.log("  2. Reload Cursor (MCP: asrax via npx @asrax/mcp)");
  console.log(`  Home: ${home}`);
}

const argv = process.argv.slice(2);
const cmd = argv[0];
if (!cmd || cmd === "-h" || cmd === "--help") {
  printHelp();
  process.exit(cmd ? 0 : 1);
}
if (cmd === "init") {
  init({ forceCreds: argv.includes("--force-creds") });
  process.exit(0);
}
console.error(`Unknown command: ${cmd}`);
printHelp();
process.exit(1);
