
export const prerender = false;

const DELAY_MS = 3000;
const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

function delay(ms){
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// POST /api/pastebin?key=<passphrase> — store content (body = raw text)
export const POST = async ({ request, locals }) => {
  const start = Date.now();
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key || key.length < 10) {
    await delay(DELAY_MS - (Date.now() - start));
    return new Response(null, { status: 400 });
  }

  const body = await request.text();
  if (!body) {
    await delay(DELAY_MS - (Date.now() - start));
    return new Response(null, { status: 400 });
  }

  const db = (locals).runtime?.env?.DB;
  if (!db) {
    await delay(DELAY_MS - (Date.now() - start));
    return new Response(null, { status: 500 });
  }

  // Create table if not exists
  await db.exec(
    `CREATE TABLE IF NOT EXISTS pastebin (key TEXT PRIMARY KEY, content TEXT NOT NULL, created_at INTEGER NOT NULL)`
  );

  // Upsert
  await db
    .prepare(`INSERT OR REPLACE INTO pastebin (key, content, created_at) VALUES (?, ?, ?)`)
    .bind(key, body, Date.now())
    .run();

  const elapsed = Date.now() - start;
  if (elapsed < DELAY_MS) await delay(DELAY_MS - elapsed);

  return new Response(null, { status: 204 });
};

// GET /api/pastebin?key=<passphrase> — retrieve and burn
export const GET = async ({ request, locals }) => {
  const start = Date.now();
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key || key.length < 10) {
    await delay(DELAY_MS - (Date.now() - start));
    return new Response(null, { status: 404 });
  }

  const db = (locals).runtime?.env?.DB;
  if (!db) {
    await delay(DELAY_MS - (Date.now() - start));
    return new Response(null, { status: 404 });
  }

  // Fetch
  const row = await db
    .prepare(`SELECT content, created_at FROM pastebin WHERE key = ?`)
    .bind(key)
    .first();

  // Delete regardless (burn after reading)
  await db.prepare(`DELETE FROM pastebin WHERE key = ?`).bind(key).run();

  // Also clean up expired entries
  await db
    .prepare(`DELETE FROM pastebin WHERE created_at < ?`)
    .bind(Date.now() - MAX_AGE_MS)
    .run();

  const elapsed = Date.now() - start;
  if (elapsed < DELAY_MS) await delay(DELAY_MS - elapsed);

  if (!row || Date.now() - row.created_at > MAX_AGE_MS) {
    return new Response(null, { status: 404 });
  }

  return new Response(row.content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  });
};
