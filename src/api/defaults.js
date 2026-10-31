import { json } from '../_lib/auth.js';
import { DEFAULTS } from '../_lib/defaults.js';

// Datos de ejemplo para el primer arranque: el admin los muestra cuando la key
// todavía no existe en KV. Solo lectura; nada se guarda hasta que el admin haga PUT /api/content.
export const onRequestGet = async ({ request }) => {
  const key = new URL(request.url).searchParams.get('key');

  if (!Object.hasOwn(DEFAULTS, key)) {
    return json({ error: `Key inválida. Usa una de: ${Object.keys(DEFAULTS).join(', ')}` }, 400);
  }

  return json(DEFAULTS[key]);
};
