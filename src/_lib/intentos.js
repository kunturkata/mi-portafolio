// Límite de intentos fallidos de login, por IP, guardado en KV (clave `intentos:{ip}`).
// Solo se escribe al fallar y, una vez bloqueada la IP, no se escribe más: así un atacante
// no puede gastar la cuota diaria de escrituras de KV (1.000/día en la capa gratuita).
// KV es eventualmente consistente: el bloqueo puede tardar hasta ~60 s en verse en otros centros de datos.
export const MAX_FALLOS = 5;
export const VENTANA_SEGUNDOS = 15 * 60;

const clave = ip => `intentos:${ip}`;

// { bloqueado: false } o { bloqueado: true, reintentarEn: segundos }
export async function estadoBloqueo(kv, ip, ahora = Date.now()) {
  const registro = await kv.get(clave(ip), { type: 'json' });
  if (!registro || registro.fallos < MAX_FALLOS) return { bloqueado: false };

  const reintentarEn = Math.ceil((registro.ultimo + VENTANA_SEGUNDOS * 1000 - ahora) / 1000);
  return reintentarEn > 0 ? { bloqueado: true, reintentarEn } : { bloqueado: false };
}

export async function registrarFallo(kv, ip, ahora = Date.now()) {
  const registro = await kv.get(clave(ip), { type: 'json' });
  const vigente = registro && ahora - registro.ultimo < VENTANA_SEGUNDOS * 1000;
  const fallos = (vigente ? registro.fallos : 0) + 1;
  await kv.put(clave(ip), JSON.stringify({ fallos, ultimo: ahora }), { expirationTtl: VENTANA_SEGUNDOS });
  return fallos;
}

// Tras un login correcto; solo borra si había algo (evita operaciones de KV innecesarias).
export async function limpiarFallos(kv, ip) {
  if (await kv.get(clave(ip))) await kv.delete(clave(ip));
}

export function mensajeBloqueo(segundos) {
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return `Demasiados intentos fallidos. Espera ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e inténtalo de nuevo.`;
}
