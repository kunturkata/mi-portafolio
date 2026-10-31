// Caché de borde (Cache API) para reducir lecturas de KV, que en la capa gratuita
// son limitadas. Es por centro de datos y puede no aplicar en *.pages.dev: si no
// hay caché, todo sigue funcionando leyendo KV directamente.
export const TTL_CONTENIDO = 60;

function claveCache(request, nombre) {
  return new Request(new URL(`/__cache/${nombre}`, request.url).toString());
}

// Valor JSON de una key de KV (o null), cacheado TTL_CONTENIDO segundos.
export async function leerKVCacheado(env, request, key) {
  const cache = caches.default;
  const clave = claveCache(request, `kv-${key}`);

  const acierto = await cache.match(clave);
  if (acierto) return await acierto.json();

  const valor = await env.KV.get(key, { type: 'json' });
  if (valor !== null) {
    await cache.put(clave, new Response(JSON.stringify(valor), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${TTL_CONTENIDO}` },
    }));
  }
  return valor;
}

// Tras guardar: borra la copia de este centro de datos (las demás caducan solas en ≤ TTL_CONTENIDO s).
export async function invalidarContenido(request, key) {
  await caches.default.delete(claveCache(request, `kv-${key}`));
}

export async function invalidarImagen(request, id) {
  const url = new URL('/api/image', request.url);
  url.searchParams.set('id', id);
  await caches.default.delete(new Request(url.toString()));
}
