import config from '../../config/config.example.json';
import catalogo from '../../config/catalogo.example.json';
import landing from '../../config/landing.example.json';
import faq from '../../config/faq.example.json';

import { leerKVCacheado } from './cache.js';
import { normalizarConfig } from './validadores.js';

export const DEFAULTS = { config, catalogo, landing, faq };

// Contenido guardado en KV o, si la key aún no existe (sitio recién desplegado),
// los datos de ejemplo: el mismo criterio que usan las páginas públicas y el admin.
// Con `request` la lectura pasa por la caché de borde; sin él, va directa a KV.
export async function getContent(env, key, request) {
  const guardado = request
    ? await leerKVCacheado(env, request, key)
    : await env.KV.get(key, { type: 'json' });
  const contenido = guardado ?? DEFAULTS[key] ?? null;
  return key === 'config' ? normalizarConfig(contenido) : contenido;
}
