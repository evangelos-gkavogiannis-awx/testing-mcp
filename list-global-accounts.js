/*
  Usage:
    AIRWALLEX_CLIENT_ID="..." \
    AIRWALLEX_API_KEY="..." \
    AIRWALLEX_ON_BEHALF_OF="acct_..." \
    node list-global-accounts.js

  Notes:
  - Uses Airwallex demo base URL: https://api-demo.airwallex.com
  - Reads credentials and on-behalf-of from environment variables.
  - Prints the list of Global Accounts as pretty JSON.
*/

const DEMO_BASE_URL = "https://api-demo.airwallex.com";

function getEnv(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function loginAndGetToken(clientId, apiKey) {
  const url = `${DEMO_BASE_URL}/api/v1/authentication/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, api_key: apiKey })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Login failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (!data || typeof data.token !== "string" || data.token.length === 0) {
    throw new Error("Login response missing token");
  }
  return data.token;
}

async function listGlobalAccounts(token, onBehalfOf) {
  const url = `${DEMO_BASE_URL}/api/v1/global_accounts`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-on-behalf-of": onBehalfOf
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`List Global Accounts failed (${response.status}): ${text}`);
  }

  return response.json();
}

(async () => {
  try {
    const clientId = getEnv("AIRWALLEX_CLIENT_ID");
    const apiKey = getEnv("AIRWALLEX_API_KEY");
    const onBehalfOf = getEnv("AIRWALLEX_ON_BEHALF_OF");

    const token = await loginAndGetToken(clientId, apiKey);
    const accounts = await listGlobalAccounts(token, onBehalfOf);

    console.log(JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error(error.message || String(error));
    process.exitCode = 1;
  }
})();


