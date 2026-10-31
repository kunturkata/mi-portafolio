import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarApp } from './ayuda.mjs';

const app = cargarApp();
const config = modo => ({ perfil: { tipo_catalogo: modo, moneda: 'USD', whatsapp: '+51 999', reserva_url: 'https://cal.com/x' } });
const catalogo = { categorias_agendamiento: ['soporte'] };
const servicio = cambios => ({ tipo: 'servicio', id: 's', nombre: 'S', precio: 10, duracion_minutos: 60, categoria: 'talleres', ...cambios });
const producto = { tipo: 'producto', id: 'p', nombre: 'P', precio: 5 };

test('productos: carrito, salvo en un catálogo solo de servicios', () => {
  assert.equal(app.accionItem(producto, config('mixto'), catalogo).tipo, 'carrito');
  assert.equal(app.accionItem(producto, config('solo-servicios'), catalogo), null);
});

test('servicios nunca van al carrito', () => {
  for (const modo of ['mixto', 'solo-servicios', 'solo-productos']) {
    assert.notEqual(app.accionItem(servicio(), config(modo), catalogo).tipo, 'carrito');
  }
});

test('servicios: cotizar > reservar > consultar', () => {
  assert.equal(app.accionItem(servicio({ precio_a_consultar: true, categoria: 'soporte' }), config('mixto'), catalogo).tipo, 'cotizar');
  const reservar = app.accionItem(servicio({ categoria: 'soporte' }), config('mixto'), catalogo);
  assert.deepEqual([reservar.tipo, reservar.url], ['reservar', 'https://cal.com/x']);
  assert.equal(app.accionItem(servicio(), config('mixto'), catalogo).tipo, 'consultar');
});

test('reserva: el enlace propio manda y calendly_url antiguo sigue funcionando', () => {
  const propio = app.accionItem(servicio({ categoria: 'soporte', reserva_url: 'https://cal.com/propio' }), config('mixto'), catalogo);
  assert.equal(propio.url, 'https://cal.com/propio');
  const antiguo = config('mixto'); delete antiguo.perfil.reserva_url; antiguo.perfil.calendly_url = 'https://calendly.com/x';
  assert.equal(app.accionItem(servicio({ categoria: 'soporte' }), antiguo, catalogo).url, 'https://calendly.com/x');
  const sinEnlace = config('mixto'); delete sinEnlace.perfil.reserva_url;
  assert.equal(app.accionItem(servicio({ categoria: 'soporte' }), sinEnlace, catalogo).tipo, 'consultar');
});

test('precio: «Desde» con variantes y con precio a consultar', () => {
  const texto = item => app.textoPrecio(item, 'USD').replace(/\s/g, ' ');
  assert.match(texto(servicio({ variantes: [{ nombre: 'a', precio: 30 }, { nombre: 'b', precio: 100 }] })), /^Desde .*30/);
  assert.match(texto(servicio({ variantes: [{ nombre: 'a', precio: 30 }, { nombre: 'b', precio: 30 }] })), /^(?!Desde).*30/);
  assert.equal(texto(servicio({ precio: 0, precio_a_consultar: true })), 'Precio a consultar');
  assert.match(texto(servicio({ precio: 20, precio_a_consultar: true })), /^Desde .*20/);
});

test('el carrito se oculta solo en solo-servicios', () => {
  assert.equal(app.usaCarrito(config('mixto')), true);
  assert.equal(app.usaCarrito(config('solo-productos')), true);
  assert.equal(app.usaCarrito(config('solo-servicios')), false);
});

test('WhatsApp: el usuario tiene prioridad sobre el número', () => {
  const con = perfil => ({ perfil });
  assert.equal(app.buildWhatsAppLink(con({ whatsapp: '+51 999' }), 'Hola, ¿qué tal?'), 'https://wa.me/51999?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F');
  assert.equal(
    app.buildWhatsAppLink(con({ whatsapp: '+51 999', whatsapp_usuario: '@revelix360' }), 'Hola'),
    'https://api.whatsapp.com/send/?text=Hola&username=revelix360&type=username&app_absent=0'
  );
  assert.equal(app.tieneWhatsApp(con({ whatsapp: '', whatsapp_usuario: 'revelix360' })), true);
  assert.equal(app.tieneWhatsApp(con({ whatsapp: '', whatsapp_usuario: null })), false);
});

test('textoDireccion arma una línea con calle, ciudad, región y código postal', () => {
  const { textoDireccion } = cargarApp();
  assert.equal(
    textoDireccion({ calle: ' Av. Larco 123 ', ciudad: 'Lima', region: null, codigo_postal: '15074', pais: 'PE' }),
    'Av. Larco 123, Lima, 15074',
  );
  assert.equal(textoDireccion({ calle: 'Av. Larco 123' }), '');
  assert.equal(textoDireccion(null), '');
});
