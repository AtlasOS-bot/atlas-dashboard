import { config } from "../config";

// Tier 1 (official API) — intentionally a stub, not a real implementation.
// Amazon's Product Advertising API (PA-API v5) requires AWS Signature V4
// request signing (a multi-step HMAC-SHA256 process), not just an API key.
// Implementing that without real credentials to test against risks a
// signature bug that fails silently (401/403) with no way to verify it here.
// isAvailable() is wired to the real config shape so turning this on later
// is just supplying credentials and filling in fetchProduct — nothing about
// how Amazon is dispatched to needs to change.
export function createAmazonApiProvider() {
  return {
    id: "amazon-official-api",
    isAvailable() {
      return Boolean(
        config.amazon.accessKey &&
          config.amazon.secretKey &&
          config.amazon.partnerTag
      );
    },
    async fetchProduct(url) {
      // TODO: implement PA-API v5 signed request once credentials exist
      // and can be tested against the real API.
      return null;
    },
  };
}
