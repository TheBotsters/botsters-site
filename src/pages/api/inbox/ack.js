
export const prerender = false;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://botsters.dev',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export const POST = async ({ request, locals }) => {
  try {
    const db = (locals).runtime?.env?.DB;
    if (!db) return json({ error: 'Database not available' }, 503);

    const { messageIds } = await request.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return json({ error: 'messageIds array required' }, 400);
    }

    const now = Date.now();
    const stmts = messageIds.map((id) =>
      db.prepare('UPDATE inbox_messages SET read_at = ? WHERE id = ? AND read_at IS NULL').bind(now, id)
    );

    await db.batch(stmts);

    return json({ success: true, count: messageIds.length });
  } catch (error) {
    console.error('Inbox ack error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};
