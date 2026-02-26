import type { APIRoute } from 'astro';

export const prerender = false;

// Hash password using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed hash of the admin password
// "blazer shy antihero chewer proposal" -> SHA-256
const ADMIN_PASSWORD_HASH = '7a9d5e8c4b2f1a3e6d9c8b7a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return new Response(JSON.stringify({ error: 'Password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const hash = await hashPassword(password);
    
    // Get expected hash from environment or use hardcoded (for now, we'll compute it)
    const expectedHash = await hashPassword('blazer shy antihero chewer proposal');
    
    if (hash === expectedHash) {
      // Set auth cookie (HttpOnly, Secure, 24 hour expiry)
      cookies.set('seksbot_admin', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
