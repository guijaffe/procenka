import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import searchReducer, { numberChanged, searchParts } from '../searchSlice';
import { fetchParts } from '../../../api/parts';
import usePartsSearch from './usePartsSearch';

const context = vi.hoisted(() => ({ store: null, effect: null }));
vi.mock('react', () => ({
  useCallback: (callback) => callback,
  useRef: (value) => ({ current: value }),
  useEffect: (callback) => { context.effect = callback; },
}));
vi.mock('react-redux', () => ({
  useDispatch: () => context.store.dispatch,
  useStore: () => context.store,
  useSelector: (selector) => selector(context.store.getState()),
}));
vi.mock('../../../api/parts', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchParts: vi.fn(),
}));

const goods = [{ brand: 'AP', number: '01089', name: 'Колодки', warehouses: [] }];

beforeEach(() => {
  context.store = configureStore({ reducer: { search: searchReducer } });
  fetchParts.mockReset().mockResolvedValue(goods);
  const location = new URL('http://localhost/?number=01089');
  vi.stubGlobal('window', {
    location,
    history: {
      pushState: vi.fn((state, title, url) => { location.href = url.href; }),
      replaceState: vi.fn((state, title, url) => { location.href = url.href; }),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => vi.unstubAllGlobals());

it('requests only offers when selecting an already loaded manufacturer', async () => {
  context.store.dispatch(numberChanged('01089'));
  await context.store.dispatch(searchParts({ number: '01089' }));
  fetchParts.mockClear();

  usePartsSearch().selectBrand('AP');

  await vi.waitFor(() => expect(context.store.getState().search.status).toBe('success'));
  expect(fetchParts).toHaveBeenCalledTimes(1);
  expect(fetchParts.mock.calls[0][0]).toEqual({ number: '01089', brand: 'AP' });
});

it('loads manufacturers before offers when opening a direct URL', async () => {
  window.location.search = '?number=01089&brand=AP';
  usePartsSearch();
  const cleanup = context.effect();

  await vi.waitFor(() => expect(context.store.getState().search.brand).toBe('AP'));
  expect(fetchParts.mock.calls.map(([params]) => params)).toEqual([
    { number: '01089' },
    { number: '01089', brand: 'AP' },
  ]);
  cleanup();
});

it('removes an unknown manufacturer from a direct URL without requesting offers', async () => {
  window.location.search = '?number=01089&brand=UNKNOWN';
  usePartsSearch();
  const cleanup = context.effect();

  await vi.waitFor(() => expect(window.history.replaceState).toHaveBeenCalled());
  expect(fetchParts).toHaveBeenCalledTimes(1);
  expect(window.location.search).toBe('?number=01089');
  expect(context.store.getState().search.brand).toBe('');
  cleanup();
});
