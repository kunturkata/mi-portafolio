// Ayudas comunes de las pruebas de integración del servidor.
//
// Dos modos:
//  - local (por defecto): levanta `wrangler dev` en un puerto libre, con estado y contraseña
//    temporales, y lo apaga al terminar. Aquí las pruebas pueden escribir datos.
//  - remoto (BASE_URL=https://…): no arranca nada; solo lectura (GET/HEAD) y un PUT sin cookie que debe dar 401.
import { spawn, execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ejemplo } from '../ayuda.mjs';

const execFileP = promisify(execFile);
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const WRANGLER = join(RAIZ, 'node_modules/wrangler/bin/wrangler.js');
const CLAVES = ['config', 'catalogo', 'landing', 'faq'];

// Contraseña solo para las pruebas locales: el servidor temporal la recibe por --var
export const PASSWORD_PRUEBA = 'clave-de-prueba-integracion';

export const dormir = ms => new Promise(r => setTimeout(r, ms));

export const decodificar = texto => String(texto)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function puertoLibre() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Pide la ruta sin seguir redirecciones y con tope de tiempo. Devuelve { status, headers, texto, json() }.
async function pedir(base, ruta, opciones = {}) {
  const res = await fetch(base + ruta, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    ...opciones,
  });
  const texto = await res.text();
  return {
    status: res.status,
    headers: res.headers,
    texto,
    json: () => JSON.parse(texto),
    location: res.headers.get('location'),
  };
}

// Primera petición al modo remoto: falla pronto y claro si no responde; hasta 2 reintentos tras un redeploy.
async function comprobarRemoto(base) {
  let ultimo = '';
  for (let intento = 0; intento < 3; intento++) {
    try {
      const r = await pedir(base, '/', { signal: AbortSignal.timeout(8000) });
      if (r.status < 500) return;
      ultimo = `respondió ${r.status}`;
    } catch (e) {
      ultimo = e.cause?.code || e.message;
    }
    if (intento < 2) await dormir(1500);
  }
  throw new Error(`BASE_URL (${base}) no responde: ${ultimo}. Revisa la URL y vuelve a intentarlo.`);
}

async function arrancarLocal() {
  const puerto = await puertoLibre();
  const dir = mkdtempSync(join(tmpdir(), 'catalogo-integracion-'));
  const persist = join(dir, 'estado');
  const base = `http://127.0.0.1:${puerto}`;
  const env = { ...process.env, NO_COLOR: '1', WRANGLER_SEND_METRICS: 'false' };

  let proceso;
  let log = '';
  const apagar = () => {
    if (proceso?.pid) {
      // Grupo de procesos: wrangler y los workerd que lanza
      try { process.kill(-proceso.pid, 'SIGKILL'); } catch { /* ya terminó */ }
    }
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* mejor esfuerzo */ }
  };
  process.once('exit', apagar);
  // El runner de node:test mata a sus hijos con SIGTERM: sin esto quedarían wrangler y workerd huérfanos
  for (const senal of ['SIGTERM', 'SIGINT']) process.once(senal, () => { apagar(); process.exit(1); });

  try {
    // Siembra con los ejemplos (sin updated_at: así «nunca guardado» es comprobable)
    for (const clave of CLAVES) {
      await execFileP(process.execPath, [WRANGLER, 'kv', 'key', 'put', '--binding=KV', '--local',
        '--persist-to', persist, clave, '--path', join(RAIZ, `config/${clave}.example.json`)],
      { cwd: RAIZ, env, timeout: 60000 });
    }

    proceso = spawn(process.execPath, [WRANGLER, 'dev', '--ip', '127.0.0.1',
      '--port', String(puerto), '--persist-to', persist, '--inspector-port', '0',
      '--var', `ADMIN_PASSWORD:${PASSWORD_PRUEBA}`],
    { cwd: RAIZ, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const acumular = d => { log = (log + d).slice(-6000); };
    proceso.stdout.on('data', acumular);
    proceso.stderr.on('data', acumular);
    let salio = null;
    proceso.once('exit', codigo => { salio = codigo ?? 'señal'; });

    const limite = Date.now() + 90000;
    for (;;) {
      if (salio !== null) throw new Error(`wrangler terminó (${salio}) antes de responder.`);
      if (Date.now() > limite) throw new Error('wrangler no respondió en 90 s.');
      try {
        const r = await pedir(base, '/', { signal: AbortSignal.timeout(3000) });
        if (r.status === 200) break;
      } catch { /* aún arrancando */ }
      await dormir(400);
    }
  } catch (e) {
    apagar();
    throw new Error(`No arrancó el servidor local: ${e.message}\n--- final del log de wrangler ---\n${log.split('\n').slice(-25).join('\n')}`);
  }
  return { base, apagar };
}

const buscarMeta = (html, atributo, valor) => {
  const etiquetas = html.match(/<meta\b[^>]*>/g) || [];
  for (const e of etiquetas) {
    if (new RegExp(`${atributo}="${valor}"`).test(e)) {
      const c = e.match(/content="([^"]*)"/);
      return c ? decodificar(c[1]) : null;
    }
  }
  return null;
};

// Utilidades de lectura sobre el HTML de una página
export const html = {
  meta: (texto, nombre) => buscarMeta(texto, 'name', nombre),
  propiedad: (texto, nombre) => buscarMeta(texto, 'property', nombre),
  canonical: texto => texto.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null,
  titulo: texto => decodificar(texto.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
  h1: texto => decodificar((texto.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim()),
  // Todos los bloques JSON-LD, ya como objetos
  jsonLd: texto => [...texto.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])),
  // Nodos de un JSON-LD (aplana @graph)
  nodos: texto => html.jsonLd(texto).flatMap(b => b['@graph'] || [b]),
};

export async function iniciar() {
  const remoto = (process.env.BASE_URL || '').trim().replace(/\/+$/, '');
  let base;
  let apagar = () => {};

  if (remoto) {
    try { new URL(remoto); } catch { throw new Error(`BASE_URL no es una URL válida: ${remoto}`); }
    base = remoto;
    await comprobarRemoto(base);
  } else {
    ({ base, apagar } = await arrancarLocal());
  }
  const esLocal = !remoto;
  const modo = esLocal ? 'local' : 'remoto (solo lectura)';
  console.log(`Integración — modo: ${modo} — URL: ${base}`);

  const get = (ruta, opciones) => pedir(base, ruta, opciones);
  const sitio = {};
  for (const clave of CLAVES) {
    const r = await get(`/api/content?key=${clave}`);
    // Sin guardar nada en KV, /api/content responde 404; en local usamos el ejemplo sembrado
    sitio[clave] = r.status === 200 ? r.json() : (esLocal ? ejemplo(clave) : null);
  }

  // Descubrimiento de ids reales: nada se asume en modo remoto
  const items = sitio.catalogo?.items || [];
  const servicios = items.filter(i => i.tipo === 'servicio');
  const productos = items.filter(i => i.tipo === 'producto');

  return {
    base, origen: new URL(base).origin, modo, esLocal, get, sitio, items,
    servicio: servicios[0] || null,
    producto: productos[0] || null,
    servicios, productos,
    moneda: sitio.config?.perfil?.moneda,
    negocio: sitio.config?.perfil?.nombre,
    detener: apagar,
  };
}

// Sesión de administración (solo local): devuelve { cookie, put(clave, valor), subir(id, bytes) }
export async function iniciarSesion(ctx) {
  const r = await ctx.get('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD_PRUEBA }),
  });
  if (r.status !== 200) throw new Error(`Login de prueba falló (${r.status}): ${r.texto}`);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  return {
    cookie,
    put: (clave, valor) => ctx.get(`/api/content?key=${clave}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(valor),
    }),
    subir: (id, bytes, tipo = 'image/png') => {
      const form = new FormData();
      form.set('id', id);
      form.set('file', new Blob([bytes], { type: tipo }), 'foto.png');
      return ctx.get('/api/upload', { method: 'POST', headers: { Cookie: cookie }, body: form });
    },
  };
}

// PNG de 1×1 válido
export const PNG_MINIMO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

