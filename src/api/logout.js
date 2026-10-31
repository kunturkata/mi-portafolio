import { clearSessionCookie, json } from '../_lib/auth.js';

export const onRequestPost = async ({ request }) => {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
};
