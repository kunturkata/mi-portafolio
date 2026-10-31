import { paginaPublica } from './_lib/paginas.js';

// El carrito es privado de cada visitante: no se indexa. Solo recibe los datos del sitio.
export const onRequestGet = paginaPublica({
  claves: ['config', 'landing'],
  meta: ({ config }) => ({ titulo: `Carrito - ${config.perfil.nombre}`, noindex: true }),
});
