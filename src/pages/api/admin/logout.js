
export const prerender = false;

export const GET = async ({ cookies, redirect }) => {
  cookies.delete('seksbot_admin', { path: '/' });
  return redirect('/admin');
};
