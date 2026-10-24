import { describe, expect, it } from 'vitest';
import { getOffers, normalizeGoods } from './parts';
import reducer, { numberChanged, searchParts } from '../features/search/searchSlice';

describe('API contract', () => {
  it('handles the documented empty record', () => {
    expect(normalizeGoods({ goods: [{}] })).toEqual([]);
  });
  it('reports service errors', () => {
    expect(() => normalizeGoods({ error: 'Invalid key client!' })).toThrow('API-ключ недействителен');
  });
  it('uses warehouse prices, includes analogues and preserves zero stock', () => {
    const data = [
      {
        brand: 'A',
        number: '1',
        price: 999,
        warehouses: [{ id: '1', price: 20, stock: 0 }],
        analogues: [{ brand: 'B', number: '2', warehouses: [{ id: '2', price: 30, stock: 4 }] }],
      },
    ];
    expect(getOffers(data).map(({ price, stock }) => ({ price, stock }))).toEqual([
      { price: 20, stock: 0 },
      { price: 30, stock: 4 },
    ]);
  });
  it('does not substitute product price when warehouse price is missing', () => {
    expect(getOffers([{ brand: 'A', price: 99, warehouses: [{ stock: 2 }] }])[0].price).toBeNull();
  });
  it('ignores stale responses after editing the article', () => {
    let state = reducer(undefined, searchParts.pending('old', { number: '1' }));
    state = reducer(state, numberChanged('2'));
    state = reducer(state, searchParts.fulfilled([{ brand: 'Old' }], 'old', { number: '1' }));
    expect(state.brands).toEqual([]);
    expect(state.number).toBe('2');
  });
});

it('distinguishes the requested product from analogues and keeps unavailable items', () => {
  const rows = getOffers([
    {
      goodsID: 'original',
      brand: 'A',
      count: 0,
      warehouses: [],
      analogues: [{ goodsID: 'analogue', brand: 'B', warehouses: [{ price: 10, stock: 2 }] }],
    },
  ]);
  expect(rows[0]).toMatchObject({ isOriginal: true, hasWarehouse: false, stock: 0 });
  expect(rows[1]).toMatchObject({ isOriginal: false, hasWarehouse: true, price: 10 });
  expect(rows[0].productId).not.toEqual(rows[1].productId);
});

it('rejects malformed warehouse data before it reaches Redux', () => {
  expect(() => normalizeGoods({ goods: [{ brand: 'A', warehouses: {} }] })).toThrow('складов');
  expect(() => normalizeGoods({ goods: [{ brand: 'A', analogues: [null] }] })).toThrow('складов');
});

it('keeps requested products in the original group even if also returned as analogues', () => {
  const duplicate = { goodsID: 'B', brand: 'B', warehouses: [{ id: '1', price: 20, stock: 2 }] };
  const rows = getOffers([{ goodsID: 'A', brand: 'A', analogues: [duplicate] }, duplicate]);
  expect(rows.find((row) => row.brand === 'B').isOriginal).toBe(true);
  expect(rows.filter((row) => row.brand === 'B')).toHaveLength(1);
});

it('keeps unique names for each manufacturer without requesting offers', () => {
  let state = reducer(undefined, searchParts.pending('brands', { number: '01089' }));
  state = reducer(
    state,
    searchParts.fulfilled(
      [
        { brand: 'B', name: 'Фильтр' },
        { brand: 'A', name: 'Прокладка' },
        { brand: 'B', name: 'Фильтр' },
        { brand: 'B', name: 'Фильтр топливный' },
        { brand: 'C' },
      ],
      'brands',
      { number: '01089' },
    ),
  );
  expect(state.brands).toEqual([
    { brand: 'A', names: ['Прокладка'] },
    { brand: 'B', names: ['Фильтр', 'Фильтр топливный'] },
    { brand: 'C', names: [] },
  ]);
  expect(state.offers).toEqual([]);
});
