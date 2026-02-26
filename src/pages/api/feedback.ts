import type { APIRoute } from 'astro';

export const prerender = false;

interface FeedbackData {
  name: string | null;
  email: string | null;
  category: string;
  message: string;
  section?: string | null;
  mailing_list?: boolean;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data: FeedbackData = await request.json();

    // Validate required fields
    if (!data.category || !data.message) {
      return new Response(
        JSON.stringify({ error: 'Category and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate category
    const validCategories = ['feature', 'bug', 'security', 'question', 'other'];
    if (!validCategories.includes(data.category)) {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate message length
    if (data.message.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Message too long (max 10000 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get D1 database from runtime
    const runtime = locals.runtime;
    const db = runtime?.env?.DB;

    if (!db) {
      // Fallback for local development without D1
      console.log('Feedback received (no DB):', data);
      return new Response(
        JSON.stringify({ success: true, message: 'Feedback received (dev mode)' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert into D1
    const result = await db
      .prepare(
        `INSERT INTO feedback (name, email, category, message, section, mailing_list, created_at, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`
      )
      .bind(
        data.name || null,
        data.email || null,
        data.category,
        data.message,
        data.section || null,
        data.mailing_list ? 1 : 0,
        hashIP(request.headers.get('cf-connecting-ip') || 'unknown')
      )
      .run();

    return new Response(
      JSON.stringify({ success: true, id: result.meta.last_row_id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Feedback error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Simple hash for IP (privacy - don't store raw IPs)
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
