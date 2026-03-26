/**
 * PocketBase read-only client for Astro build-time data fetching.
 * Uses plain fetch — no SDK dependency.
 * PB_URL env var selects staging vs prod at build time.
 */

const PB_URL = import.meta.env.PB_URL || "https://cms-staging.botstersdev.com";

/**
 * Fetch all records from a collection (handles pagination automatically).
 * Returns plain array of record objects.
 */
export async function getCollection(name, params = {}) {
  const allItems = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      ...params,
    });
    const res = await fetch(`${PB_URL}/api/collections/${name}/records?${query}`);
    if (!res.ok) {
      throw new Error(`PocketBase fetch failed: ${name} (HTTP ${res.status})`);
    }
    const data = await res.json();
    allItems.push(...data.items);
    if (allItems.length >= data.totalItems) break;
    page++;
  }

  return allItems;
}

/**
 * Fetch a single site_settings value by key.
 * Returns the parsed JSON value, or null if not found.
 */
export async function getSetting(key) {
  const res = await fetch(
    `${PB_URL}/api/collections/site_settings/records?filter=(key="${key}")&perPage=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.items.length) return null;
  try {
    return JSON.parse(data.items[0].value);
  } catch {
    return data.items[0].value;
  }
}
