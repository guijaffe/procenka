import { expect, it } from 'vitest';
import { groupOffers } from './groupOffers';

it('places available products first across the whole result set, preserving all products', () => {
  const products = groupOffers([
    { productId: 'empty', hasWarehouse: false, stock: 0 },
    { productId: 'zero', hasWarehouse: true, stock: 0 },
    { productId: 'unknown', hasWarehouse: true, stock: null },
    { productId: 'available', hasWarehouse: true, stock: 0 },
    { productId: 'available', hasWarehouse: true, stock: 3 },
  ]);
  expect(products.map((product) => product.productId)).toEqual(['available', 'unknown', 'empty', 'zero']);
  expect(products[0].warehouses).toHaveLength(2);
});

it('sorts products by total stock and warehouses by individual stock without changing the input', () => {
  const offers = [
    { productId: 'single', hasWarehouse: true, stock: 7 },
    { productId: 'multiple', hasWarehouse: true, stock: 3 },
    { productId: 'multiple', hasWarehouse: true, stock: null },
    { productId: 'multiple', hasWarehouse: true, stock: 0 },
    { productId: 'multiple', hasWarehouse: true, stock: 5 },
    { productId: 'zero', hasWarehouse: true, stock: 0 },
  ];
  const original = structuredClone(offers);
  const products = groupOffers(offers);
  expect(products.map(({ productId }) => productId)).toEqual(['multiple', 'single', 'zero']);
  expect(products[0].totalStock).toBe(8);
  expect(products[0].warehouses.map(({ stock }) => stock)).toEqual([5, 3, 0, null]);
  expect(offers).toEqual(original);
});
