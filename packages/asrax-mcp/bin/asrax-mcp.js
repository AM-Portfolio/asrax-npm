#!/usr/bin/env node
/**
 * @asrax/mcp — stdio MCP client for AM Hub (no amctl clone required).
 *
 * Env / ~/.asrax credentials:
 *   ASRAX_MCP_URL (default https://am-dev.asrax.in/mcp/sse)
 *   ASRAX_KEY_* or AM_MCP_CLIENT_ID + AM_MCP_CLIENT_SECRET
 */
import { spawn } from "node:child_process";
import process from "node:process";
import { loadCreds } from "../lib/creds.js";
import { obtainAccessToken } from "../lib/auth.js";

function required(name) {
  const value = (process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is required in ~/.asrax/credentials.env or process env`);
  }
  return value;
}

async function main() {
  loadCreds();
  if (!(process.env.ASRAX_MCP_URL || "").trim()) {
    process.env.ASRAX_MCP_URL = "https://am-dev.asrax.in/mcp/sse";
  }
  const mcpUrl = required("ASRAX_MCP_URL");
  const accessToken = await obtainAccessToken();

  let transport = (process.env.ASRAX_MCP_TRANSPORT || "").trim().toLowerCase();
  if (!transport) {
    const path = mcpUrl.replace(/\/$/, "").toLowerCase();
    if (
      path.endsWith("/sse") ||
      path.endsWith("/mcp/sse") ||
      path.endsWith("/mcp")
    ) {
      transport = "sse-only";
    } else {
      transport = "sse-only";
    }
  }

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = [
    "-y",
    "mcp-remote",
    mcpUrl,
    "--transport",
    transport,
    "--header",
    `Authorization:Bearer ${accessToken}`,
  ];
  if (mcpUrl.startsWith("http://")) args.push("--allow-http");

  const child = spawn(npx, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  const forward = (signal) => {
    if (child.pid) child.kill(signal);
  };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));

  const code = await new Promise((resolve) => {
    child.on("exit", (c) => resolve(c ?? 1));
    child.on("error", (err) => {
      console.error(`asrax-mcp: failed to spawn ${npx}:`, err.message);
      resolve(1);
    });
  });
  process.exit(code);
}

main().catch((err) => {
  console.error(`asrax-mcp: ${err.message || err}`);
  process.exit(1);
});
