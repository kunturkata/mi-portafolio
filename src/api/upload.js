import { json, verifySession } from '../_lib/auth.js';
import { getContent } from '../_lib/defaults.js';
import { invalidarImagen } from '../_lib/cache.js';
import { ID_RESERVADOS, ID_GALERIA } from '../_lib/validadores.js';

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const onRequestPost = async ({ request, env }) => {
  if (!(await verifySession(request, env))) {
    return json({ error: 'No autorizado' }, 401);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'FormData inválido' }, 400);
  }

  const id = formData.get('id');
  const file = formData.get('file');

  if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
    return json({ error: 'ID inválido' }, 400);
  }

  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return json({ error: 'Archivo requerido' }, 400);
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return json({ error: 'Formato no permitido. Solo JPEG, PNG y WebP' }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return json({ error: 'Archivo muy grande (máximo 5MB)' }, 400);
  }

  // Los ids reservados (p. ej. la foto de «Sobre mí») no son items del catálogo
  if (!ID_RESERVADOS.includes(id)) {
    const catalogo = await getContent(env, 'catalogo', request);
    if (!catalogo || !Array.isArray(catalogo.items)) {
      return json({ error: 'Catálogo no encontrado' }, 404);
    }

    // «{id}-g{n}» es una foto extra de la galería: solo los servicios la tienen
    const galeria = ID_GALERIA.exec(id);
    const base = galeria && catalogo.items.find(item => item.id === galeria[1]);
    if (base && !catalogo.items.some(item => item.id === id)) {
      if (base.tipo !== 'servicio') {
        return json({ error: `'${base.id}' es un producto: solo los servicios pueden tener galería de fotos.` }, 400);
      }
    } else if (!catalogo.items.some(item => item.id === id)) {
      return json({ error: `El ID '${id}' no existe en el catálogo. Guarda el catálogo con ese producto o servicio y vuelve a subir la foto.` }, 400);
    }
  }

  const key = `items/${id}.${ext}`;
  const body = await file.arrayBuffer();

  await env.IMAGES.put(key, body, {
    metadata: { contentType: file.type },
  });

  for (const otherExt of Object.values(ALLOWED_TYPES)) {
    if (otherExt !== ext) {
      await env.IMAGES.delete(`items/${id}.${otherExt}`);
    }
  }

  await invalidarImagen(request, id);

  return json({ ok: true, url: `/api/image?id=${encodeURIComponent(id)}`, key });
};
