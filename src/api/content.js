import { json, verifySession } from '../_lib/auth.js';
import { leerKVCacheado, invalidarContenido } from '../_lib/cache.js';
import { getContent } from '../_lib/defaults.js';
import { normalizarConfig, validateConfig, validateCatalogo, validateLanding, validateFAQ } from '../_lib/validadores.js';

export { validateConfig, validateCatalogo, validateLanding, validateFAQ };

const CONTENT_KEYS = ['config', 'catalogo', 'landing', 'faq'];

const validators = {
  config: validateConfig,
  catalogo: validateCatalogo,
  landing: validateLanding,
  faq: validateFAQ,
};

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!CONTENT_KEYS.includes(key)) {
    return json({ error: 'Key inválida' }, 400);
  }

  try {
    const leido = await leerKVCacheado(env, request, key);
    const data = key === 'config' ? normalizarConfig(leido) : leido;
    if (!data) {
      return json({ error: 'Contenido no encontrado' }, 404);
    }
    // El navegador puede reutilizarlo 60 s; el admin pide con cache: 'no-store'
    return json(data, 200, { 'Cache-Control': 'public, max-age=60' });
  } catch {
    return json({ error: 'Error obteniendo contenido' }, 500);
  }
};

export const onRequestPut = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!CONTENT_KEYS.includes(key)) {
    return json({ error: 'Key inválida' }, 400);
  }

  if (!(await verifySession(request, env))) {
    return json({ error: 'No autorizado' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido', detalle: 'El body debe ser JSON válido' }, 400);
  }

  if (key === 'config') body = normalizarConfig(body);

  try {
    if (key === 'landing') {
      const catalogo = await getContent(env, 'catalogo', request);
      validateLanding(body, new Set((catalogo?.items || []).map(item => item.id)));
    } else {
      validators[key](body);
    }
    // La fecha va en la metadata de KV (no en el JSON) y alimenta el <lastmod> del sitemap
    const updated_at = new Date().toISOString();
    await env.KV.put(key, JSON.stringify(body), { metadata: { updated_at } });
    await invalidarContenido(request, key);
    return json({ ok: true, updated_at });
  } catch (error) {
    return json({ error: 'JSON inválido', detalle: error.message }, 400);
  }
};
