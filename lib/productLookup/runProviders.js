// Tries providers in priority order (official API -> structured feed/API ->
// HTML parsing -> nothing). The first one that is configured AND returns a
// usable product wins; a provider that isn't configured or fails is simply
// skipped so the next one in line gets a chance.
export async function runProviders(providers, url) {
  for (const provider of providers) {
    if (!provider.isAvailable()) continue;

    try {
      const product = await provider.fetchProduct(url);
      if (product) {
        return { product, providerId: provider.id };
      }
    } catch (err) {
      // This provider failed — fall through to the next one in priority order.
    }
  }

  return { product: null, providerId: null };
}
