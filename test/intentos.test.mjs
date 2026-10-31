import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoBloqueo, registrarFallo, limpiarFallos, MAX_FALLOS, VENTANA_SEGUNDOS } from '../src/_lib/intentos.js';

// KV en memoria con la misma forma que el binding (get/put/delete) y conteo de escrituras
function kvFalso() {
  const datos = new Map();
  return {
    escrituras: 0,
    async get(clave) { return datos.has(clave) ? JSON.parse(datos.get(clave)) : null; },
    async put(clave, valor) { this.escrituras++; datos.set(clave, valor); },
    async delete(clave) { datos.delete(clave); },
  };
}

test('se bloquea al llegar al máximo de fallos y avisa cuánto esperar', async () => {
  const kv = kvFalso();
  const t0 = 1_000_000;
  for (let i = 0; i < MAX_FALLOS - 1; i++) await registrarFallo(kv, '1.2.3.4', t0);
  assert.equal((await estadoBloqueo(kv, '1.2.3.4', t0)).bloqueado, false);

  await registrarFallo(kv, '1.2.3.4', t0);
  const estado = await estadoBloqueo(kv, '1.2.3.4', t0 + 60_000);
  assert.equal(estado.bloqueado, true);
  assert.equal(estado.reintentarEn, VENTANA_SEGUNDOS - 60);
});

test('el bloqueo expira y no afecta a otras IP', async () => {
  const kv = kvFalso();
  const t0 = 1_000_000;
  for (let i = 0; i < MAX_FALLOS; i++) await registrarFallo(kv, '1.2.3.4', t0);
  assert.equal((await estadoBloqueo(kv, '5.6.7.8', t0)).bloqueado, false);
  assert.equal((await estadoBloqueo(kv, '1.2.3.4', t0 + VENTANA_SEGUNDOS * 1000 + 1)).bloqueado, false);
});

test('fuera de la ventana el contador vuelve a empezar', async () => {
  const kv = kvFalso();
  await registrarFallo(kv, 'ip', 0);
  assert.equal(await registrarFallo(kv, 'ip', VENTANA_SEGUNDOS * 1000 + 1), 1);
});

test('un login correcto limpia los fallos, y sin fallos no toca KV', async () => {
  const kv = kvFalso();
  await limpiarFallos(kv, 'ip');
  assert.equal(kv.escrituras, 0);
  await registrarFallo(kv, 'ip', 0);
  await limpiarFallos(kv, 'ip');
  assert.equal(await kv.get('intentos:ip'), null);
});
