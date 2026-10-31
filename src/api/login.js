import { createSessionCookie, json, timingSafeStringEqual } from '../_lib/auth.js';
import { estadoBloqueo, registrarFallo, limpiarFallos, mensajeBloqueo } from '../_lib/intentos.js';

const LONGITUD_RECOMENDADA = 12;

export const onRequestPost = async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: 'ADMIN_PASSWORD no configurada' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) {
    return json({ error: 'Contraseña requerida' }, 400);
  }

  // En local no hay cabecera de IP: todos los intentos cuentan como "local"
  const ip = request.headers.get('CF-Connecting-IP') || 'local';

  const bloqueo = await estadoBloqueo(env.KV, ip);
  if (bloqueo.bloqueado) {
    return json({ error: mensajeBloqueo(bloqueo.reintentarEn) }, 429, { 'Retry-After': String(bloqueo.reintentarEn) });
  }

  if (!timingSafeStringEqual(password, env.ADMIN_PASSWORD)) {
    await registrarFallo(env.KV, ip);
    return json({ error: 'Contraseña incorrecta' }, 401);
  }

  await limpiarFallos(env.KV, ip);

  const respuesta = { ok: true };
  if (env.ADMIN_PASSWORD.length < LONGITUD_RECOMENDADA) {
    respuesta.aviso = `Tu contraseña tiene menos de ${LONGITUD_RECOMENDADA} caracteres. Cámbiala por una más larga en Cloudflare: Workers & Pages → tu Worker → Settings → Variables and Secrets → ADMIN_PASSWORD.`;
  }

  const cookie = await createSessionCookie(request, env);
  return json(respuesta, 200, { 'Set-Cookie': cookie });
};
