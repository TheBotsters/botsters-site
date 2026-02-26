import type { APIRoute } from 'astro';

export const prerender = false;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://botsters.dev',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    if (!db) return json({ error: 'Database not available' }, 503);

    const { from, threadId, replyTo, body } = await request.json();

    if (!from || !threadId || !body) {
      return json({ error: 'from, threadId, and body are required' }, 400);
    }

    // Get thread and check sealing
    const thread = await db.prepare('SELECT * FROM inbox_threads WHERE id = ?').bind(threadId).first();
    if (!thread) return json({ error: 'Thread not found' }, 404);

    if (thread.sealed) {
      return json({ error: 'thread_sealed', reason: 'max_replies' }, 409);
    }

    if (thread.reply_count >= thread.max_replies) {
      // Seal it
      await db.prepare('UPDATE inbox_threads SET sealed = 1 WHERE id = ?').bind(threadId).run();
      return json({ error: 'thread_sealed', reason: 'max_replies' }, 409);
    }

    if (thread.deadline && Date.now() > thread.deadline) {
      await db.prepare('UPDATE inbox_threads SET sealed = 1 WHERE id = ?').bind(threadId).run();
      return json({ error: 'thread_sealed', reason: 'deadline_passed' }, 409);
    }

    // Determine to_agent from the thread's last message or original
    const lastMsg = await db.prepare(
      'SELECT from_agent, to_agent FROM inbox_messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(threadId).first();

    const toAgent = lastMsg && lastMsg.from_agent !== from ? lastMsg.from_agent : lastMsg?.to_agent || from;

    const messageId = crypto.randomUUID();
    const now = Date.now();
    const newReplyCount = thread.reply_count + 1;
    const shouldSeal = newReplyCount >= thread.max_replies ? 1 : 0;

    await db.batch([
      db.prepare(
        'INSERT INTO inbox_messages (id, thread_id, from_agent, to_agent, body, reply_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(messageId, threadId, from, toAgent, body, replyTo || null, now),
      db.prepare(
        'UPDATE inbox_threads SET reply_count = ?, sealed = ? WHERE id = ?'
      ).bind(newReplyCount, shouldSeal, threadId),
    ]);

    return json({ messageId });
  } catch (error) {
    console.error('Inbox reply error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};
