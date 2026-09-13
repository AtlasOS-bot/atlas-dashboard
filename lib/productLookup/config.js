// The only place API credentials are read from. Adding a real integration
// later is: set the env var, and the matching provider's isAvailable()
// starts returning true — no other file needs to change.
export const config = {
  amazon: {
    accessKey: process.env.AMAZON_PAAPI_ACCESS_KEY || null,
    secretKey: process.env.AMAZON_PAAPI_SECRET_KEY || null,
    partnerTag: process.env.AMAZON_PAAPI_PARTNER_TAG || null,
  },
  walmart: {
    apiKey: process.env.WALMART_API_KEY || null,
  },
  bestBuy: {
    apiKey: process.env.BESTBUY_API_KEY || null,
  },
};
