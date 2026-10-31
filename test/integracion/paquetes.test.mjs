// Importa cada paquete de inicio (config/paquetes/*.json) como lo hace Admin → Respaldo
// (PUT de config, catalogo, landing y faq, en ese orden) y comprueba que el sitio lo sirve.
// Solo en local, sobre el estado temporal.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iniciar, iniciarSesion } from './ayuda.mjs';
import { copia } from '../ayuda.mjs';

const ctx = await iniciar();
after(() => ctx.detener());

const cargar = nombre => JSON.parse(readFileSync(new URL(`../../config/paquetes/${nombre}.json`, import.meta.url), 'utf8'));
const local = (nombre, fn) => test(nombre, async t => {
  if (!ctx.esLocal) return t.skip('requiere modo local');
  await fn(t);
});

let admin;
local('login de prueba', async () => { admin = await iniciarSesion(ctx); });

for (const nombre of ['solo-servicios', 'solo-productos', 'mixto']) {
  local(`importar el paquete ${nombre} y ver el sitio`, async () => {
    const paquete = cargar(nombre);
    for (const clave of ['config', 'catalogo', 'landing', 'faq']) {
      const r = await admin.put(clave, paquete[clave]);
      assert.equal(r.status, 200, `PUT ${clave}: ${r.texto}`);
    }
    const portada = await ctx.get('/');
    assert.equal(portada.status, 200);
    assert.match(portada.texto, /Tu Nombre o Negocio/);

    const item = paquete.catalogo.items[0];
    const ficha = await ctx.get(item.tipo === 'servicio' ? `/servicio/${item.id}` : `/producto/${item.id}`);
    assert.equal(ficha.status, 200);

    const mapa = (await ctx.get('/sitemap.xml')).texto;
    const disponibles = paquete.catalogo.items.filter(i => i.disponible !== false);
    for (const i of disponibles) assert.ok(mapa.includes(`/${i.tipo}/${i.id}`), `sitemap sin ${i.id}`);
    for (const i of paquete.catalogo.items.filter(i => i.disponible === false)) {
      assert.ok(!mapa.includes(`/${i.tipo}/${i.id}`), `sitemap no debe incluir ${i.id}`);
    }
  });
}

local('el servidor rechaza una sección única repetida', async () => {
  const landing = copia(cargar('mixto').landing);
  landing.secciones.push({ tipo: 'contacto', titulo: 'Otro contacto', contenido: '', items_ids: [] });
  const r = await admin.put('landing', landing);
  assert.equal(r.status, 400);
  assert.match(r.texto, /Solo puede haber una sección «Contacto»/);
});
