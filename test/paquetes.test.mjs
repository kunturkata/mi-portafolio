// Los paquetes de inicio (config/paquetes/*.json) se importan desde Admin → Respaldo:
// deben pasar los mismos validadores que el guardado real y aprovechar los límites al máximo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateConfig, validateCatalogo, validateLanding, validateFAQ, SECCIONES_UNICAS } from '../src/_lib/validadores.js';

const PAQUETES = ['solo-servicios', 'solo-productos', 'mixto'];
const cargar = nombre => JSON.parse(readFileSync(new URL(`../config/paquetes/${nombre}.json`, import.meta.url), 'utf8'));
const TIPOS_SECCION = ['texto', 'destacados', 'galeria', 'sobre-mi', 'testimonios', 'contacto'];

for (const nombre of PAQUETES) {
  test(`paquete ${nombre}: formato de respaldo y validadores`, () => {
    const p = cargar(nombre);
    assert.equal(p.version, 1);
    validateConfig(p.config);
    validateCatalogo(p.catalogo);
    validateLanding(p.landing, new Set(p.catalogo.items.map(i => i.id)));
    validateFAQ(p.faq);
  });

  test(`paquete ${nombre}: coherente con su tipo de catálogo`, () => {
    const p = cargar(nombre);
    const tipos = new Set(p.catalogo.items.map(i => i.tipo));
    const esperado = { 'solo-servicios': ['servicio'], 'solo-productos': ['producto'], mixto: ['producto', 'servicio'] }[nombre];
    assert.equal(p.config.perfil.tipo_catalogo, nombre);
    assert.deepEqual([...tipos].sort(), esperado);
    if (nombre === 'solo-productos') assert.equal(p.config.perfil.reserva_url, null);
  });

  test(`paquete ${nombre}: usa los límites al máximo`, () => {
    const p = cargar(nombre);
    // Portada y secciones: los 6 tipos, sin repetir los únicos
    const tipos = p.landing.secciones.map(s => s.tipo);
    for (const t of TIPOS_SECCION) assert.ok(tipos.includes(t), `falta la sección ${t}`);
    for (const t of Object.keys(SECCIONES_UNICAS)) assert.equal(tipos.filter(x => x === t).length, 1, `${t} repetida`);
    assert.ok(p.landing.secciones.some(s => s.posicion === 'antes'));
    assert.equal(p.landing.secciones.find(s => s.tipo === 'testimonios').testimonios.length, 8);
    assert.ok(p.landing.secciones.find(s => s.tipo === 'sobre-mi').nombre);
    // FAQ y perfil completos
    assert.equal(p.faq.preguntas.length, 15);
    const perfil = p.config.perfil;
    assert.ok(perfil.email && perfil.direccion?.pais);
    assert.ok(Object.values(perfil.redes).every(Boolean), 'todas las redes');
    assert.ok(p.landing.tema.color_acento);
    // Categorías de cada tipo presentes y al menos un item destacado y uno no disponible
    assert.ok(p.catalogo.items.some(i => i.destacado));
    assert.ok(p.catalogo.items.some(i => i.disponible === false));
    // Servicios: todas las opciones del modelo
    const servicios = p.catalogo.items.filter(i => i.tipo === 'servicio');
    if (servicios.length) {
      assert.ok(servicios.some(s => s.variantes?.length === 6), '6 variantes');
      assert.ok(servicios.some(s => s.galeria?.length === 6), '6 fotos de galería');
      assert.ok(servicios.some(s => s.incluye?.length === 8), '8 líneas en «qué incluye»');
      assert.ok(servicios.some(s => s.precio_a_consultar && s.precio > 0), 'precio a consultar con base');
      assert.ok(servicios.some(s => s.precio_a_consultar && s.precio === 0), 'precio a consultar sin base');
      assert.ok(servicios.some(s => s.reserva_url), 'reserva propia');
      for (const m of ['online', 'presencial', 'ambas']) assert.ok(servicios.some(s => s.modalidad === m), m);
      assert.ok(p.catalogo.categorias_agendamiento.length > 0);
    }
  });
}
