# `@asrax/setup`

Bootstrap AM laptop home (`~/.asrax`) and Cursor MCP **without cloning amctl**.

```bash
npx -y @asrax/setup init
```

Then edit `~/.asrax/credentials.env` and reload Cursor.

This merges:

```json
"asrax": {
  "command": "npx",
  "args": ["-y", "@asrax/mcp"]
}
```

into `~/.cursor/mcp.json` (other servers are kept).

## Options

- `--force-creds` — overwrite `credentials.env` with the template
