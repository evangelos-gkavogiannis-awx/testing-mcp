/*
  Usage:
    AIRWALLEX_CLIENT_ID="..." \
    AIRWALLEX_API_KEY="..." \
    [AIRWALLEX_ON_BEHALF_OF="acct_..."] \
    node get-all-global-accounts.js

  Notes:
  - Uses Airwallex demo base URL: https://api-demo.airwallex.com
  - Reads credentials from environment variables.
  - Optionally uses x-on-behalf-of header if AIRWALLEX_ON_BEHALF_OF is set.
  - Handles pagination to retrieve ALL global accounts.
  - Prints the complete list of Global Accounts as pretty JSON.
*/

const DEMO_BASE_URL = "https://api-demo.airwallex.com";

function getEnv(name, required = true) {
  const value = process.env[name];
  if (required && (!value || value.trim().length === 0)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function createBearerToken(clientId, apiKey) {
  const url = `${DEMO_BASE_URL}/api/v1/authentication/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, api_key: apiKey })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to create bearer token (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (!data || typeof data.token !== "string" || data.token.length === 0) {
    throw new Error("Login response missing token");
  }
  
  console.error("✓ Bearer token created successfully");
  return data.token;
}

async function retrieveAllGlobalAccounts(token, onBehalfOf = null) {
  const allAccounts = [];
  let pageNum = 0;
  const pageSize = 50;
  let hasMore = true;

  while (hasMore) {
    const url = `${DEMO_BASE_URL}/api/v1/global_accounts?page_num=${pageNum}&page_size=${pageSize}`;
    const headers = {
      Authorization: `Bearer ${token}`
    };

    if (onBehalfOf) {
      headers["x-on-behalf-of"] = onBehalfOf;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Failed to retrieve global accounts (${response.status}): ${text}`);
    }

    const data = await response.json();
    
    if (data.items && Array.isArray(data.items)) {
      allAccounts.push(...data.items);
      console.error(`✓ Retrieved page ${pageNum + 1}: ${data.items.length} accounts`);
    }

    hasMore = data.has_more === true;
    pageNum++;
  }

  console.error(`✓ Total global accounts retrieved: ${allAccounts.length}`);
  return allAccounts;
}

(async () => {
  try {
    const clientId = getEnv("AIRWALLEX_CLIENT_ID");
    const apiKey = getEnv("AIRWALLEX_API_KEY");
    const onBehalfOf = getEnv("AIRWALLEX_ON_BEHALF_OF", false);

    // Step 1: Create bearer token
    const token = await createBearerToken(clientId, apiKey);

    // Step 2: Retrieve all global accounts
    const accounts = await retrieveAllGlobalAccounts(token, onBehalfOf);

    // Output the results
    console.log(JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error("Error:", error.message || String(error));
    process.exitCode = 1;
  }
})();

