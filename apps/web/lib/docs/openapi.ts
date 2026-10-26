import { FACTS } from "./content";
import { SITE } from "./agents";

/** OpenAPI 3.1 description of the public HTTP endpoints. Testnet only; contains no secrets. */
export function openApiSpec() {
  const error = { description: "Error", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" }, code: { type: "string" } } } } } };
  return {
    openapi: "3.1.0",
    info: {
      title: "nata public API",
      version: "0.1.0",
      description: `Pay-per-visit campaigns on ${FACTS.network}. ${FACTS.tokenSymbol} is a test token with no monetary value.`,
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
    },
    servers: [{ url: SITE }],
    paths: {
      "/api/campaigns": {
        get: {
          operationId: "listCampaigns",
          summary: "List campaigns (free)",
          responses: {
            "200": { description: "Campaigns read from the Soroban contract", content: { "application/json": { schema: { type: "object", properties: { campaigns: { type: "array", items: { type: "object" } } } } } } },
            "502": error,
          },
        },
      },
      "/api/faucet": {
        post: {
          operationId: "requestFaucet",
          summary: `Mint test ${FACTS.tokenSymbol} to a Stellar address (rate limited)`,
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["address"], properties: { address: { type: "string", description: "Stellar G... account or C... contract address. A G address needs the trustline first." } } } } },
          },
          responses: {
            "200": { description: "Sent", content: { "application/json": { schema: { type: "object", properties: { hash: { type: "string" }, pending: { type: "boolean" }, amount: { type: "string" }, explorer: { type: "string" } } } } } },
            "202": { description: "Submitted, still pending" },
            "400": error,
            "422": error,
            "429": error,
            "503": error,
          },
        },
      },
      "/api/x402/campaigns-premium": {
        get: {
          operationId: "premiumCampaigns",
          summary: "Active campaigns with budget analytics, paid per request over x402",
          description: `Answers HTTP 402 with x402 v2 payment requirements (default price 0.01 ${FACTS.tokenSymbol}) until paid. Returns 503 when the deployment has no X402_PAY_TO. Guide: ${FACTS.repo}/blob/main/docs/X402.md`,
          responses: {
            "200": { description: "Paid response", content: { "application/json": { schema: { type: "object" } } } },
            "402": { description: "Payment required (x402)" },
            "502": error,
            "503": error,
          },
        },
      },
    },
  };
}
