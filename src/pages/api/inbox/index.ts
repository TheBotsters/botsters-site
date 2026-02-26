import type { APIRoute } from 'astro';

export const prerender = false;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://botsters.dev',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

async function ensureTables(db: any) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS inbox_threads (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      max_replies INTEGER NOT NULL DEFAULT 5,
      deadline INTEGER,
      reply_count INTEGER NOT NULL DEFAULT 0,
      sealed INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS inbox_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      from_agent TEXT NOT NULL,
      to_agent TEXT NOT NULL,
      body TEXT NOT NULL,
      reply_to TEXT,
      created_at INTEGER NOT NULL,
      read_at INTEGER,
      FOREIGN KEY (thread_id) REFERENCES inbox_threads(id)
    )`),
  ]);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    if (!db) return json({ error: 'Database not available' }, 503);

    await ensureTables(db);

    const data = await request.json();
    const { from, to, body, maxReplies = 5, deadline } = data;

    if (!from || !to || !body) {
      return json({ error: 'from, to, and body are required' }, 400);
    }

    const threadId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const now = Date.now();
    const deadlineMs = deadline ? new Date(deadline).getTime() : null;

    await db.batch([
      db.prepare(
        `INSERT INTO inbox_threads (id, created_at, max_replies, deadline, reply_count, sealed) VALUES (?, ?, ?, ?, 0, 0)`
      ).bind(threadId, now, maxReplies, deadlineMs),
      db.prepare(
        `INSERT INTO inbox_messages (id, thread_id, from_agent, to_agent, body, reply_to, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)`
      ).bind(messageId, threadId, from, to, body, now),
    ]);

    return json({ threadId, messageId });
  } catch (error) {
    console.error('Inbox POST error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    if (!db) return json({ error: 'Database not available' }, 503);

    await ensureTables(db);

    const agent = url.searchParams.get('agent');
    if (!agent) return json({ error: 'agent parameter required' }, 400);

    const unreadOnly = url.searchParams.get('unread') === 'true';

    let messageQuery = `SELECT m.*, t.max_replies, t.reply_count, t.sealed, t.deadline, t.created_at as thread_created_at
      FROM inbox_messages m JOIN inbox_threads t ON m.thread_id = t.id
      WHERE (m.to_agent = ? OR m.from_agent = ?)`;

    const params: any[] = [agent, agent];

    if (unreadOnly) {
      messageQuery += ` AND m.read_at IS NULL AND m.to_agent = ?`;
      params.push(agent);
    }

    messageQuery += ` ORDER BY m.created_at DESC`;

    const results = await db.prepare(messageQuery).bind(...params).all();

    // Group by thread
    const threads: Record<string, any> = {};
    for (const msg of results.results) {
      if (!threads[msg.thread_id]) {
        threads[msg.thread_id] = {
          threadId: msg.thread_id,
          createdAt: msg.thread_created_at,
          maxReplies: msg.max_replies,
          replyCount: msg.reply_count,
          sealed: !!msg.sealed,
          deadline: msg.deadline,
          messages: [],
        };
      }
      threads[msg.thread_id].messages.push({
        id: msg.id,
        from: msg.from_agent,
        to: msg.to_agent,
        body: msg.body,
        replyTo: msg.reply_to,
        createdAt: msg.created_at,
        readAt: msg.read_at,
      });
    }

    return json({ threads: Object.values(threads) });
  } catch (error) {
    console.error('Inbox GET error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};
