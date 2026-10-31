import { json, verifySession } from '../_lib/auth.js';

export const onRequestGet = async ({ request, env }) => {
  const authenticated = await verifySession(request, env);
  if (!authenticated) {
    return json({ error: 'No autorizado' }, 401);
  }
  return json({ authenticated: true });
};
