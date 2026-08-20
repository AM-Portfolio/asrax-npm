# `@asrax/mcp`

AM MCP Hub client for Cursor and other IDEs. **No amctl clone required.**

## Install / run

```bash
npx -y @asrax/mcp
```

Or via Cursor `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "asrax": {
      "command": "npx",
      "args": ["-y", "@asrax/mcp"]
    }
  }
}
```

## Credentials

Put tokens in `~/.asrax/credentials.env` (never in mcp.json):

- `ASRAX_KEY_ID` + `ASRAX_KEY_SECRET`, **or**
- `AM_MCP_CLIENT_ID` + `AM_MCP_CLIENT_SECRET`
- Optional: `ASRAX_MCP_URL` (default `https://am-dev.asrax.in/mcp/sse`)
- Optional: `KEYCLOAK_TOKEN_URL` (preferred over `OIDC_TOKEN_URL` for am-dev)

Bootstrap with:

```bash
npx -y @asrax/setup init
```

## Requirements

- Node 18+
- Network access to the hub URL and Keycloak/identity
