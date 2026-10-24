export function groupOffers(offers) {
  const products = new Map();
  offers.forEach((offer) => {
    if (!products.has(offer.productId)) {
      products.set(offer.productId, { ...offer, warehouses: [], totalStock: 0 });
    }
    const product = products.get(offer.productId);
    product.isOriginal ||= offer.isOriginal;
    if (offer.hasWarehouse) {
      product.warehouses.push(offer);
      product.totalStock += offer.stock ?? 0;
    }
  });
for (const product of products.values()) {
    product.warehouses.sort((a, b) => (b.stock ?? -1) - (a.stock ?? -1));
  }
  return [...products.values()].sort(
    (a, b) => availabilityRank(a) - availabilityRank(b) || b.totalStock - a.totalStock,
  );
}

function availabilityRank(product) {
  if (product.totalStock > 0) return 0;
  if (product.warehouses.some((offer) => offer.stock === null)) return 1;
  return 2;
}
