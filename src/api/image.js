const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function safeKey(value) {
  if (typeof value !== 'string') return null;

  const key = value.startsWith('items/') ? value.slice('items/'.length) : value;
  if (!/^[a-z0-9-]+(\.[a-z0-9]+)?$/.test(key)) return null;

  return key.includes('.') ? `items/${key}` : key;
}

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = safeKey(url.searchParams.get('id')) || safeKey(url.searchParams.get('url'));

  if (!key) {
    return new Response('Imagen no encontrada', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Caché de borde: evita una lectura de KV por cada foto y visita
  const cache = caches.default;
  const guardada = await cache.match(request);
  if (guardada) return guardada;

  const candidates = key.includes('.') ? [key] : EXTENSIONS.map(ext => `items/${key}.${ext}`);

  for (const candidate of candidates) {
    const { value, metadata } = await env.IMAGES.getWithMetadata(candidate, { type: 'arrayBuffer' });
    if (!value) continue;

    const contentType = metadata?.contentType || 'application/octet-stream';

    // En el borde se guarda poco tiempo (una foto reemplazada se ve pronto); el navegador la guarda 1 hora
    await cache.put(request, new Response(value, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300' },
    }));

    return new Response(value, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new Response('Imagen no encontrada', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
};
