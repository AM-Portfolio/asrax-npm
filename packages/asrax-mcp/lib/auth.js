/**
 * Auth for AM MCP Hub — mirrors ai-catalog/mcp/bridges/asrax_mcp_remote.py
 */
export async function exchangeApiKey(identityUrl, keyId, secret) {
  const res = await fetch(`${identityUrl.replace(/\/$/, "")}/auth/api-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ key_id: keyId, secret }),
  });
  if (!res.ok) {
    const err = new Error(`identity /auth/api-key HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const payload = await res.json();
  const token = payload.access_token;
  if (!token) throw new Error("identity /auth/api-key returned no access_token");
  return String(token);
}

export async function exchangeClientCredentials(tokenUrl, clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "am-asrax-mcp",
    },
    body,
  });
  if (!res.ok) {
    const err = new Error(`OIDC client_credentials HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const payload = await res.json();
  const token = payload.access_token;
  if (!token) throw new Error("OIDC client_credentials returned no access_token");
  return String(token);
}

export async function obtainAccessToken() {
  const keyId = (process.env.ASRAX_KEY_ID || "").trim();
  const keySecret = (process.env.ASRAX_KEY_SECRET || "").trim();
  if (keyId && keySecret) {
    const identityUrl = (
      process.env.ASRAX_IDENTITY_URL || "https://am.asrax.in/identity"
    ).trim();
    try {
      return await exchangeApiKey(identityUrl, keyId, keySecret);
    } catch (exc) {
      const status = exc.status;
      if (status && ![401, 403, 404].includes(status)) throw exc;
    }
  }

  const clientId = (process.env.AM_MCP_CLIENT_ID || "").trim();
  const clientSecret = (process.env.AM_MCP_CLIENT_SECRET || "").trim();
  const tokenCandidates = [];
  for (const key of ["KEYCLOAK_TOKEN_URL", "OIDC_TOKEN_URL"]) {
    const val = (process.env[key] || "").trim();
    if (val && !tokenCandidates.includes(val)) tokenCandidates.push(val);
  }
  if (tokenCandidates.length === 0) {
    const keycloak = (
      process.env.KEYCLOAK_URL || "https://auth.munish.org/auth"
    ).replace(/\/$/, "");
    const mcpUrl = (process.env.ASRAX_MCP_URL || "").toLowerCase();
    const defaultRealm =
      mcpUrl.includes("am-dev.asrax.in") ? "am-dev-realm" : "am-preprod-realm";
    const realm = process.env.KEYCLOAK_REALM || defaultRealm;
    tokenCandidates.push(
      `${keycloak}/realms/${realm}/protocol/openid-connect/token`
    );
  }

  if (clientId && clientSecret) {
    let lastErr;
    for (const tokenUrl of tokenCandidates) {
      try {
        return await exchangeClientCredentials(tokenUrl, clientId, clientSecret);
      } catch (exc) {
        lastErr = exc;
        if (exc.status && ![401, 403].includes(exc.status)) throw exc;
      }
    }
    if (lastErr) throw lastErr;
  }

  throw new Error(
    "Set ASRAX_KEY_ID/ASRAX_KEY_SECRET or AM_MCP_CLIENT_ID/AM_MCP_CLIENT_SECRET in ~/.asrax/credentials.env"
  );
}
