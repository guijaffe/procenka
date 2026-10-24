import { afterEach, expect, it, vi } from 'vitest';
import { fetchParts } from './parts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('encodes the article and brand and requests analogues only at stage two', async () => {
  vi.stubEnv('VITE_FAVORIT_API_KEY', 'test-key');
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ goods: [] }) });
  vi.stubGlobal('fetch', request);
  const signal = new AbortController().signal;
  await fetchParts({ number: 'A#1&2' }, signal);
  await fetchParts({ number: 'A#1&2', brand: 'Meat & Doria' }, signal);
  const [first, second] = request.mock.calls.map(([url]) => url);
  expect(first.searchParams.get('number')).toBe('A#1&2');
  expect(first.searchParams.has('analogues')).toBe(false);
  expect(second.searchParams.get('brand')).toBe('Meat & Doria');
  expect(second.searchParams.get('analogues')).toBe('on');
});

it('reports HTTP failures', async () => {
  vi.stubEnv('VITE_FAVORIT_API_KEY', 'test-key');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => {
        throw new SyntaxError();
      },
    }),
  );
  await expect(fetchParts({ number: '1' }, new AbortController().signal)).rejects.toThrow('HTTP 503');
});

it('reports broken JSON and network errors', async () => {
  vi.stubEnv('VITE_FAVORIT_API_KEY', 'test-key');
  const request = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError();
      },
    })
    .mockRejectedValueOnce(new TypeError());
  vi.stubGlobal('fetch', request);
  await expect(fetchParts({ number: '1' }, new AbortController().signal)).rejects.toThrow(
    'некорректный ответ',
  );
  await expect(fetchParts({ number: '1' }, new AbortController().signal)).rejects.toThrow('подключиться');
});

it('shows the service quota error returned with HTTP 403, even with text/plain content type', async () => {
  vi.stubEnv('VITE_FAVORIT_API_KEY', 'test-key');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Request quota exceeded!' }), {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      }),
    ),
  );
  await expect(fetchParts({ number: '1221' }, new AbortController().signal)).rejects.toThrow(
    'Превышен лимит запросов',
  );
});

it('reuses successful responses for one minute, then fetches fresh data', async () => {
  vi.stubEnv('VITE_FAVORIT_API_KEY', 'cache-test');
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ goods: [] }) });
  vi.stubGlobal('fetch', request);
  const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    const signal = new AbortController().signal;
    await fetchParts({ number: 'cache-article' }, signal);
    await fetchParts({ number: 'cache-article' }, signal);
    expect(request).toHaveBeenCalledTimes(1);
    now.mockReturnValue(61_001);
    await fetchParts({ number: 'cache-article' }, signal);
    expect(request).toHaveBeenCalledTimes(2);
  } finally {
    now.mockRestore();
  }
});

it('preserves a machine-readable quota reason and does not cache failures', async () => {
  vi.stubEnv('VITE_FAVORIT_API_KEY', 'quota-test');
  const request = vi
    .fn()
    .mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'Request quota exceeded!' }) });
  vi.stubGlobal('fetch', request);
  const signal = new AbortController().signal;
  await expect(fetchParts({ number: '1221' }, signal)).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
  await expect(fetchParts({ number: '1221' }, signal)).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
  expect(request).toHaveBeenCalledTimes(2);
});
