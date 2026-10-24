const API_ERRORS = {
  'Request quota exceeded!':
    'Превышен лимит запросов: Favorit Parts ограничил поиск по этому артикулу для текущего ключа. Можно искать другие артикулы. Для этого поиска потребуется доступная квота у поставщика.',
  'Empty key!': 'Не указан API-ключ покупателя.',
  'Invalid key client!': 'API-ключ недействителен: сервис не нашёл покупателя.',
  'Empty number goods!': 'Укажите артикул детали.',
};

const responseCache = new Map();
const CACHE_TTL = 60_000;
const CACHE_LIMIT = 10;

function createApiError(error) {
  const message = String(error);
  const result = new Error(API_ERRORS[message] || message);
  if (message === 'Request quota exceeded!') result.code = 'QUOTA_EXCEEDED';
  return result;
}

export function normalizeGoods(payload) {
  if (payload?.error) throw createApiError(payload.error);
  const goods = Array.isArray(payload) ? payload : payload?.goods;
  if (!Array.isArray(goods)) throw new Error('Сервис вернул ответ неизвестного формата.');
  const validGoods = goods.filter((item) => item && typeof item.brand === 'string' && item.brand.trim());
  for (const item of validGoods) {
    if (item.analogues != null && !Array.isArray(item.analogues)) {
      throw new Error('Сервис вернул некорректный список аналогов.');
    }
    for (const part of [item, ...(item.analogues || [])]) {
      if (
        !part ||
        typeof part.brand !== 'string' ||
        !part.brand.trim() ||
        (part.warehouses != null &&
          (!Array.isArray(part.warehouses) ||
            part.warehouses.some((warehouse) => !warehouse || typeof warehouse !== 'object')))
      ) {
        throw new Error('Сервис вернул некорректные данные детали или складов.');
      }
    }
  }
  return validGoods;
}

export function getBrands(goods) {
  const brands = new Map();
  for (const item of goods) {
    if (!brands.has(item.brand)) brands.set(item.brand, { brand: item.brand, names: [] });
    const names = brands.get(item.brand).names;
    if (item.name && !names.includes(item.name)) names.push(item.name);
  }
  return [...brands.values()].sort((a, b) => a.brand.localeCompare(b.brand));
}

export function getOffers(goods) {
  const seen = new Set();
  const originalIds = new Set(goods.map((item) => JSON.stringify([item.goodsID || item.number, item.brand])));
  return goods
    .flatMap((item) => [item, ...(item.analogues || [])])
    .flatMap((item) =>
      (item.warehouses?.length ? item.warehouses : [{ stock: item.count === 0 ? 0 : null }]).map(
        (warehouse) => {
          const productId = JSON.stringify([item.goodsID || item.number, item.brand]);
          const id = JSON.stringify([
            item.goodsID || item.number,
            item.brand,
            warehouse.id || warehouse.code,
            warehouse.price,
            warehouse.stock,
          ]);
          if (seen.has(id)) return null;
          seen.add(id);
          return {
            id,
            productId,
            isOriginal: originalIds.has(productId),
            hasWarehouse: Boolean(item.warehouses?.length),
            name: item.name || 'Без названия',
            brand: item.brand,
            number: item.number,
            warehouse: warehouse.code || warehouse.id || 'Не указан',
            price: Number.isFinite(warehouse.price) ? warehouse.price : null,
            stock: Number.isFinite(warehouse.stock) && warehouse.stock >= 0 ? warehouse.stock : null,
          };
        },
      ),
    )
    .filter(Boolean);
}

function toRequestError(error, signal, timeout) {
  if (signal.aborted) return error;
  if (timeout.aborted) return new Error('Сервис не ответил за 15 секунд. Повторите поиск.');
  if (error instanceof TypeError)
    return new Error('Не удалось подключиться к сервису. Проверьте сеть и доступность API (CORS).');
  if (error instanceof SyntaxError) return new Error('Сервис вернул некорректный ответ. Повторите поиск позже.');
  return error;
}

export async function fetchParts({ number, brand }, signal) {
  const key = import.meta.env.VITE_FAVORIT_API_KEY;
  if (!key)
    throw new Error('Для поиска нужен клиентский API-ключ. Укажите его в .env и перезапустите приложение.');
  const url = new URL(import.meta.env.VITE_FAVORIT_API_URL || 'http://api.favorit-parts.ru/hs/hsprice/');
  url.search = new URLSearchParams({ key, number, ...(brand ? { brand, analogues: 'on' } : {}) });
  signal.throwIfAborted();
  const cacheKey = url.href;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.goods;
  responseCache.delete(cacheKey);
  const timeout = AbortSignal.timeout(15000);
  let response;
  let payload;
  try {
    response = await fetch(url, { signal: AbortSignal.any([signal, timeout]) });
    payload = response.ok ? await response.json() : await response.json().catch(() => null);
  } catch (error) {
    throw toRequestError(error, signal, timeout);
  }
  if (!response.ok) {
    if (payload?.error) throw createApiError(payload.error);
    throw new Error(`Сервис недоступен (HTTP ${response.status}). Попробуйте позже.`);
  }
  const goods = normalizeGoods(payload);
  signal.throwIfAborted();
  if (responseCache.size >= CACHE_LIMIT) responseCache.delete(responseCache.keys().next().value);
  responseCache.set(cacheKey, { goods, expiresAt: Date.now() + CACHE_TTL });
  return goods;
}
