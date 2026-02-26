import type { APIRoute } from 'astro';

export const prerender = false;

// Check cookie auth (web admin)
function isAuthenticated(cookies: any): boolean {
  const authCookie = cookies.get('seksbot_admin');
  return authCookie?.value === 'authenticated';
}

// Check bearer token auth (API access for agents)
function isTokenAuthenticated(request: Request, env: any): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === env?.FEEDBACK_API_TOKEN;
}

// GET - List feedback (bearer token auth for agents)
export const GET: APIRoute = async ({ request, locals, url }) => {
  const runtime = locals.runtime;
  const env = runtime?.env;
  
  if (!isTokenAuthenticated(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Bearer token required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Optional query params
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const unreviewed = url.searchParams.get('unreviewed') === 'true';
    const category = url.searchParams.get('category');

    let query = 'SELECT id, name, email, category, message, created_at, reviewed FROM feedback';
    const conditions: string[] = [];
    const params: any[] = [];

    if (unreviewed) {
      conditions.push('reviewed = 0');
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const result = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ 
      success: true, 
      count: result.results.length,
      feedback: result.results 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Feedback list error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch feedback' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ request, cookies, locals }) => {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { id, reviewed } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const runtime = locals.runtime;
    const db = runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare('UPDATE feedback SET reviewed = ? WHERE id = ?')
      .bind(reviewed ? 1 : 0, id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update error:', error);
    return new Response(JSON.stringify({ error: 'Update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies, locals }) => {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { id } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const runtime = locals.runtime;
    const db = runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare('DELETE FROM feedback WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
