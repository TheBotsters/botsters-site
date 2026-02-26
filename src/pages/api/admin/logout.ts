import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('seksbot_admin', { path: '/' });
  return redirect('/admin');
};
