# AGENTS.md — Catálogo Personal desplegable en Cloudflare

## 1. Estado actual (verificado 2026-10-30)

**Migrado de Pages a Workers (2026-10-30)** para ofrecer el botón «Deploy to Cloudflare» (README): un Worker con Static Assets (`src/worker.js`, `assets` en `wrangler.jsonc`), KV sin IDs en el repo y `.dev.vars.example` para el secreto. `npm test` (44) y `npm run test:integracion` local (34 ok) pasan con `wrangler dev`. **Botón verificado (2026-10-30):** con `wrangler.jsonc` el asistente crea los dos KV con los nombres que se escriban y los enlaza (con `wrangler.toml` no); los nombres por defecto son iguales y fallan, hay que cambiarlos. **Sin verificar:** las menciones a `personal-ecommerce.pages.dev` en los SUMMARY son históricas.

El producto está orientado a **servicios de profesionales independientes y emprendedores**; los productos son un extra. El flujo local funciona sin Cloudflare login.

- `npm run dev` arranca en `http://localhost:8788` y en la LAN (`0.0.0.0:8788`). `npm test` ejecuta 44 pruebas de Node (validadores, límite de intentos, acciones del frontend).
- `wrangler.jsonc` no lleva IDs de KV: el botón «Deploy to Cloudflare» crea los dos namespaces y escribe sus `id` en el repo de cada persona (sección «Despliegue con el botón»).
- Auth con cookie HMAC-SHA256 (`src/_lib/auth.js`) y límite de 5 fallos / 15 min por IP en `/api/login` (`_lib/intentos.js`). El middleware protege `/admin/*` (salvo login) y `PUT /api/content`/`POST /api/upload`.
- Los servicios no usan carrito: una sola acción (cotizar, reservar o consultar por WhatsApp). El carrito es solo de productos y se oculta en `solo-servicios` (sección 8).
- Servicios con modalidad, zona, qué incluye, variantes de precio y galería de hasta 6 fotos extra (mosaico y visor en la ficha); reserva genérica (`reserva_url`); `landing.secciones` se pinta en la portada (incluye `sobre-mi` y `testimonios`); color de acento configurable con contraste AA; analítica opcional (Cloudflare Web Analytics).
- Estado local persistido en `.wrangler/state` (el KV local actual contiene un catálogo de panadería de pruebas, no el de ejemplo). La foto de ejemplo `sobre-mi` se borró del KV local.
- Verificado en esta sesión con `npm run dev`, curl y jsdom (no hay navegador real en la máquina de desarrollo). Detalle en `VALIDATION_SUMMARY.md`.
- Pendiente (despliegue): (1) **creación automática del PR** del workflow de sincronización con *Allow GitHub Actions to create and approve pull requests* activado (hoy solo se ha visto el camino de fallback con enlace en el resumen); (2) que una persona ajena siga la guía de punta a punta (`docs/friction-log.md`).
- Pendiente: revisión visual completa en navegador real (`docs/e2e-checklist.md`; en esta sesión se revisó con Chromium de Playwright la portada en los 4 estilos y los editores del admin a 375px); probar el despliegue real en Cloudflare con una persona ajena (`docs/friction-log.md`); no hay `lint` ni `typecheck`.

## 2. Contexto y stack (cerrado)

Template para que una persona sin terminal haga fork y despliegue su propia instancia en Cloudflare. **No es SaaS multi-inquilino.**

| Capa | Servicio | Rol |
|---|---|---|
| Frontend | Workers Static Assets (`public/`) | Landing, catálogo, ficha, carrito, FAQ, admin |
| API | Worker (`src/worker.js`) | Endpoints `/api/*` y páginas con SEO |
| Contenido | Workers KV | Keys exactas: `config`, `catalogo`, `landing`, `faq` |
| Imágenes | Workers KV (namespace separado, binding `IMAGES`) | Convención `items/{id}.{ext}`; R2 descartado porque exige método de pago |
| Auth admin | `ADMIN_PASSWORD` | Protege `/admin/*` y escrituras en `/api/*` |
| Citas | Enlace de reserva (Calendly, Cal.com, Google Calendar…) | Enlace global + override opcional por servicio |
| WhatsApp | `wa.me` | Enlaces generados en cliente |
| Carrito | `localStorage` | Estado efímero, sin servidor |

Bindings:

| Binding | Local | Producción |
|---|---|---|
| `env.KV` | KV local automático | Namespace KV real |
| `env.IMAGES` | KV local automático | Segundo namespace KV real (fotos) |
| `env.ADMIN_PASSWORD` | `.dev.vars` (gitignoreado; plantilla en `.dev.vars.example`) | Secret (el botón «Deploy to Cloudflare» lo pide desde `.dev.vars.example`) |
| `env.ASSETS` | Automático | `assets.binding = "ASSETS"` en `wrangler.jsonc` |

Los dos `kv_namespaces` de `wrangler.jsonc` (formato JSONC, no TOML) van **sin `id`**: `wrangler deploy` y el botón «Deploy to Cloudflare» crean los namespaces solos. No pongas IDs reales en el repo (es público). No agregues `[site]`, `[build]`, `[vars]` ni `[[env]]` con secretos.

## 3. Reglas duras (violarlas es un bug)

1. **Solo KV, nunca D1.** Si crees que necesitas D1, detente y pregunta.
2. **Sin tokens de API ni secretos en el repo.** La única credencial es `ADMIN_PASSWORD` vía `env.ADMIN_PASSWORD`; local en `.dev.vars`, producción como Secret del dashboard. `upload.js` ya usa el binding `env.IMAGES` y no contiene credenciales.
3. **Sin commits automáticos.** El contenido vive en KV, no en el repo.
4. **Toda escritura de contenido pasa por `PUT /api/content`.** El cliente nunca hace `KV.put`.
5. **Las fotos solo se escriben desde `/api/upload`.** El cliente nunca escribe directo en el KV de imágenes. Usa el binding `env.IMAGES` (`put/getWithMetadata/delete`), no SDKs externos.
6. **Frontend vanilla**: HTML + CSS + JS. Sin React, Vue, Svelte, Alpine, HTMX ni frameworks CSS.
7. **Solo `wrangler` como devDependency.** No agregues `@aws-sdk/*` ni librerías de runtime; usa APIs nativas de Cloudflare/Web.
8. **Valida el JSON antes de `KV.put`** y devuelve `400` con detalle en español.
9. **Nombres de dominio y UI en español neutro**; funciones técnicas pueden ir en inglés.
10. **Un solo Worker** (`"main": "src/worker.js"`, `export default { fetch }`). Los módulos de `src/` conservan la forma `export const onRequestGet/Put/Post` y `_middleware.js` con `onRequest`, pero **se enrutan a mano en `src/worker.js`**: una ruta nueva se añade allí y a `assets.run_worker_first` en `wrangler.jsonc`. No uses `addEventListener('fetch')`.
11. **No uses `--persist`** (eliminado en Wrangler 4.x). La persistencia local es automática; si necesitas ruta, `--persist-to <dir>`.
12. **No uses sintaxis de Workers Sites** (`[site]`) ni de Pages (`pages_build_output_dir`, `wrangler pages …`). Usa `[assets]` y `wrangler dev` / `wrangler deploy`.
13. **Móvil primero** (375px), HTML semántico, `alt`, contraste AA y navegación por teclado en el admin.
14. **Verifica con `npm test` y con `npm run dev` + llamadas reales.** `npm test` cubre validadores, límite de intentos y la lógica de acciones del frontend (Node, sin dependencias); `npm run test:integracion` prueba el servidor real (ver sección 4); ninguno sustituye la prueba en el navegador.

## 4. Comandos y setup local

```bash
npm install
npm run dev        # http://localhost:8788 y LAN 0.0.0.0:8788
npm run deploy     # wrangler deploy
```

- Para abrir desde otro dispositivo: `hostname -I | awk '{print $1}'` y visita `http://<IP>:8788`; si no conecta, permite el puerto `8788` en el firewall.
- `env.KV` y `env.IMAGES` funcionan en local sin login.
- `npm run deploy` también requiere autenticación de Wrangler (`npx wrangler login`); no agregues tokens al repo.
- Sembrar KV local (las keys deben ser exactamente `config`, `catalogo`, `landing`, `faq`):

```bash
npx wrangler kv key put --binding=KV --local config   --path=config/config.example.json
npx wrangler kv key put --binding=KV --local catalogo --path=config/catalogo.example.json
npx wrangler kv key put --binding=KV --local landing  --path=config/landing.example.json
npx wrangler kv key put --binding=KV --local faq      --path=config/faq.example.json
npx wrangler kv key get --binding=KV --local config
```

- Los `config/*.example.json` no se cargan solos; hay que sembrarlos y volver a sembrar tras editarlos.
- `npm test` (runner integrado de Node, sin dependencias) ejecuta `test/*.test.mjs`: validadores, límite de intentos de login y `accionItem`/`textoPrecio` de `app.js`. No hay `npm run lint` ni typecheck. Los antiguos `validate-phase*.sh` y `test-all-phases.sh` se eliminaron (eran greps no fiables).
- `npm run test:integracion` (`test/integracion/*.test.mjs`, separado de `npm test`; reporter propio `reporte.mjs`: solo fallos y «n ok, n fallos, n omitidas»; helper común `ayuda.mjs`). Dos modos:
  - **Local (por defecto):** levanta su propio `wrangler dev` en un puerto libre (≠ 8788) con `--persist-to` en un directorio temporal, `ADMIN_PASSWORD` de prueba por `--var` y KV sembrado con `config/*.example.json`; lo apaga y borra el directorio al terminar. Cubre fichas, redirecciones 301/404, portada, JSON-LD (Organization/LocalBusiness), `og:locale`, sitemap (`lastmod`, no disponibles), recorte, FAQ/carrito, cabeceras de `_headers`, auth, login/sesión y subida de foto. Escribe datos solo en ese estado temporal (`publico.test.mjs` y `escritura.test.mjs` arrancan cada uno el suyo).
  - **Remoto, solo lectura:** `BASE_URL=https://catalogo-personal.pages.dev npm run test:integracion` no arranca nada. **Regla estricta: solo GET/HEAD y un `PUT /api/content` sin cookie que debe dar 401; nunca login, subidas ni `PUT` autenticado.** Descubre un servicio y un producto leyendo `/api/content?key=catalogo`; las pruebas que necesitan modificar datos se omiten («requiere modo local») y las pasivas (dirección, items no disponibles, recorte, foto) corren solo si el sitio ya tiene esos datos.
- Verificación real ya ejecutada: `npm run dev` compila; `GET /api/content?key=config|catalogo|landing|faq` devuelve 200; `POST /api/login` setea cookie; `/api/session` con cookie devuelve 200; `PUT /api/content` autenticado devuelve 200; `POST /api/upload` devuelve 200; `GET /api/image?id=pan-integral` devuelve la imagen; `POST /api/logout` invalida la sesión; `/admin/identidad` sin cookie redirige a `/admin/index.html`.

## 5. Estructura real y entrypoints

```text
public/
  index.html, producto.html, carrito.html, faq.html   # cargan /assets/app.js
  admin/*.html                                       # cargan ../assets/admin.js
  assets/{app.js,admin.js,styles.css}
  assets/images/placeholder.png
src/
  worker.js                                          # router: rutas → módulos, middleware, ASSETS
  _middleware.js
  _lib/auth.js
  index.js, faq.js, producto.js, producto/[id].js, servicio/[id].js, carrito.js     # páginas públicas con SEO y datos inyectados
  sitemap.xml.js, robots.txt.js
  _lib/{auth,defaults,cache,paginas,validadores,intentos}.js
  api/{content,defaults,login,logout,session,upload,image}.js
config/*.example.json
wrangler.jsonc, package.json, README.md
.github/workflows/sincronizar-template.yml   # manual: abre un PR con los cambios del template (excluye wrangler.jsonc y .github/)
test/*.test.mjs
AGENTS_SUMMARY.md, VALIDATION_SUMMARY.md
```

- `public/` es `assets.directory`. Las rutas dinámicas están en `src/worker.js` (tabla `EXACTAS`/`CON_ID`) y deben coincidir con `assets.run_worker_first`; lo demás se sirve directo sin invocar el Worker. Si un manejador no atiende el método, la petición sigue a `env.ASSETS` (como en Pages).
- `public/_headers` fija `nosniff`, `Referrer-Policy` y `X-Frame-Options` en los estáticos, caché de 30 días para la fuente, 1 día para las imágenes y `X-Robots-Tag: noindex` en `/admin/*` (no afecta a las respuestas de las Functions). Existe `docs/` (guía, checklist E2E, registro de fricciones). `AGENTS_SUMMARY.md` es la memoria de sesión y `VALIDATION_SUMMARY.md` el log de pruebas; ambos se actualizaron el 2026-10-29.

## 6. Contratos de datos

**Paquetes de inicio** (`config/paquetes/{solo-servicios,solo-productos,mixto}.json`): respaldos completos (`version`, `config`, `catalogo`, `landing`, `faq`) importables desde Admin → Respaldo. Texto genérico («Servicio 1», «Producto 1») con todo al máximo: los 6 tipos de sección (los únicos una vez, uno en posición `antes`), 8 testimonios marcados «[Ejemplo n]» (no son opiniones reales), 15 FAQ, perfil con dirección y las 4 redes, y en servicios 6 variantes, galería de 6, 8 líneas de «qué incluye», precio a consultar con y sin base, reserva propia, las tres modalidades y un item no disponible. Items: 8 servicios, 8 productos o 6+6 (el tope de 200 no se usa). No traen fotos (la ficha cae al placeholder). Están cubiertos por `test/paquetes.test.mjs` (validadores y cobertura de límites) y `test/integracion/paquetes.test.mjs` (importación real). Si cambian los límites o los campos del modelo, regenéralos y actualiza esas pruebas.


La referencia ejecutable son `config/*.example.json` (ejemplo: tienda de Capa Gratuita; precios, WhatsApp `+00000000000` es un marcador a reemplazar; el email es opcional y va en `null`). Las páginas públicas no llevan el nombre del negocio en el HTML: `app.js` lo rellena desde `config.perfil` (`aplicarMarca`: logo, pie, redes con `data-red`, título). Campos y límites que el validador y la UI esperan:

- `config`: `perfil` (antes `negocio`; `normalizarConfig` en `validadores.js` traduce los datos antiguos al leer y al guardar) con `nombre`, `descripcion_corta`, `whatsapp` (número) y/o `whatsapp_usuario` (nombre de usuario, sin `@`; hace falta al menos uno y, si hay ambos, gana el usuario: `buildWhatsAppLink` usa `https://api.whatsapp.com/send/?text=…&username=…&type=username&app_absent=0` en vez de `wa.me`), `email` (string|null, opcional), `moneda` (ISO 4217), `tipo_catalogo` (antes `modo_negocio`) (`solo-productos|solo-servicios|mixto`), `reserva_url` (string|null, opcional; antes `calendly_url`, que se sigue leyendo), `logo_url` (string|null), `direccion` (opcional, objeto|null: `calle≤120`, `ciudad≤80` obligatoria si se rellena algo, `region≤80`, `codigo_postal≤20`, `pais` ISO de 2 letras en mayúsculas; el admin la edita en «Dirección» de General y la guarda `null` si está vacía y `aplicarMarca` la muestra como `<address class="footer-direccion">` en el pie (`textoDireccion`, sin código de país), para que coincida con el JSON-LD; alimenta `address` del JSON-LD `LocalBusiness`), `redes.instagram/facebook` (string|null). Opcional a nivel raíz: `analitica{cf_token}` (token de Cloudflare Web Analytics, 16–64 alfanuméricos; `paginaPublica` inyecta el beacon en las páginas indexables, nunca en carrito, 404 ni admin).
- `catalogo`: `categorias` tipadas como `{ producto: [...], servicio: [...] }` e `items` (máx. 200). El array plano legacy sigue aceptándose y el admin lo migra al cargar. Cada item: `id` slug único `^[a-z0-9-]+$`, `tipo` (`producto|servicio`), `nombre`, `descripcion` (spec ≤200), `precio` número ≥0, `categoria` existente en la lista de su tipo o `""` (opcional), `disponible`/`destacado` booleanos, `duracion_minutos` número en servicios y `null` en productos, `reserva_url` string|null (opcional; antes `calendly_url`). `modalidad` (`online|presencial|ambas`), `zona` (≤80), `incluye` (≤8 líneas de ≤100) y `variantes[{nombre≤60, precio≥0, duracion_minutos≥0|null}]` (≤6) y `galeria[{n, alt≤100?}]` (≤6; ver «Imágenes») son opcionales y solo para servicios (el validador los rechaza en productos); con variantes, la tarjeta y la ficha muestran «Desde» el precio más bajo y el JSON-LD usa `AggregateOffer`; el admin los edita en «Detalles del servicio» (filas con nombre, precio y minutos opcionales; botones «Añadir opción» —máx. 6— y «Quitar»; las filas vacías se ignoran y las inválidas se avisan al guardar) y fija `precio` al mínimo de las variantes. `precio_a_consultar` boolean opcional, solo en servicios (el validador rechaza `true` en productos): con `true` el precio es orientativo, se muestra «Desde X» si `precio` > 0 o «Precio a consultar» si es 0, el item no entra al carrito y su botón es «Consultar por WhatsApp» (`buildCotizacionLink`, con nombre y duración estimada); tiene prioridad sobre la reserva. En el admin, «Enlace de reserva propio» solo se ve en servicios cuya categoría es agendable (conserva su valor al ocultarse; la web lo ignora si la categoría no lo es). `categorias_agendamiento` es un array opcional de categorías de servicio; solo los servicios de esas categorías usan el enlace de reserva (`urlReserva` en `app.js`). Si falta el campo, el admin infiere `cita`/`citas` al cargar y las páginas públicas no marcan ninguna. El panel del admin solo lista categorías de servicio y guarda únicamente esas.
- `landing`: `hero{titulo,subtitulo,cta_texto,cta_enlace,imagen_fondo_url}`, `secciones[]` con `tipo` (`texto|destacados|galeria|contacto|sobre-mi|testimonios`), `titulo`, `contenido` (≤2000), `items_ids`; `testimonios[{texto≤300, autor≤60, detalle≤80}]` (≤8, solo en `tipo: testimonios`); `nombre` (string ≤60, opcional, solo en `tipo: sobre-mi`: firma bajo la presentación y fuente de las iniciales cuando no hay foto; sin `nombre` y sin foto solo se muestra el texto); `tema{fuente,estilo,color_acento?}`; `seo{titulo,descripcion}`. El admin (`admin/landing.html`) edita con pestañas en dos niveles: un selector de nivel 1 (`Portada | Apariencia y SEO | Secciones (n)`, ancho completo, sin scroll en móvil) y, solo dentro de «Secciones», una cabecera fija con el botón «+ Añadir sección» y, debajo, una fila de nivel 2 con una pestaña por sección. «Secciones» abre la última sección vista (o la primera); sin secciones muestra un aviso vacío. Al eliminar una sección vuelve a «Secciones». Las flechas/Inicio/Fin navegan dentro de cada fila (estado en memoria `secciones`; alta con selector de tipo, subir/bajar, eliminar, casillas para `items_ids` desde el catálogo, tarjetas para testimonios, aviso de cambios sin guardar). `admin.putContent` muestra `detalle` del servidor, no solo `error`. `secciones[].posicion` (`antes|despues`, opcional, por defecto `despues`) decide si la sección va justo bajo la portada o debajo del catálogo; `index.html` pinta cada grupo en el orden guardado (`#secciones-antes`, `#secciones-landing`; `renderizarSecciones`) y las vacías no se muestran. El admin guarda `posicion` solo cuando es `antes`. **Secciones únicas:** `sobre-mi`, `contacto` y `testimonios` solo pueden aparecer una vez (`SECCIONES_UNICAS` en `validadores.js`; el validador responde 400 «Solo puede haber una sección «…»»). El editor las atenúa y deshabilita en «+ Añadir sección» y en el selector de tipo si ya existen (`tipoOcupado` en `admin/landing.html`); `texto`, `destacados` y `galeria` sí se pueden repetir. `sobre-mi` usa la foto con id reservado `sobre-mi`, que se sube desde el propio editor de la sección («Tu foto»: vista previa y «Subir foto», al momento y sin pulsar Guardar; `montarFotoSobreMi` en `admin/landing.html`, con `admin.optimizarImagen` y `POST /api/upload`) o, como cualquier otra foto, desde `POST /api/upload` ( `ID_RESERVADOS` en `validadores.js` lo prohíbe en el catálogo y `/api/upload` lo acepta sin item). `contacto` añade botones de WhatsApp y correo desde `config.perfil`. El ejemplo no incluye testimonios a propósito (no inventar opiniones). **Arte de las secciones** (`index.html` + `styles.css`, bloque «Arte de las secciones»): cada `h2` lleva una línea de acento (`h2::after`); título y texto de `texto`, `sobre-mi` y `contacto` van siempre centrados, a cualquier ancho (`sobre-mi` es una columna única de 720px: foto, texto y firma; no hay cambio de layout por breakpoint); `contacto` lleva además botones del mismo ancho en móvil; `sobre-mi` pone la foto con marco desplazado de acento y, si no hay foto, un círculo con las iniciales de `secciones[].nombre` (`.sobre-mi-iniciales`; antes salían de `perfil.nombre`, que es el del negocio) y, sin nombre, solo el texto; `testimonios` usa comilla en círculo de acento (`.testimonio::before`), avatar con iniciales (`.testimonio-avatar`) y en móvil se desliza en horizontal (`scroll-snap`). Todo con variables, sin colores de marca fijos.
- `faq`: `preguntas[{p,r}]` (máx. 15). Los campos antiguos `perfil.tono_chat` y `tono` (solo los usaba el chat) se aceptan y se ignoran; el admin ya no los guarda.

El validador ya comprueba unicidad de `id`, existencia de `categoria` en la lista de su tipo (salvo `""`), longitud de `descripcion`, enums de `tipo_catalogo`/`fuente`/`estilo`, booleanos y que `categorias_agendamiento` solo contenga categorías de servicio. También valida email y URLs (`reserva_url`/`calendly_url`, `logo_url`, redes: http(s) absolutas; `logo_url` admite ruta `/…`) y, en `PUT landing`, que `items_ids` existan en el catálogo guardado (o el de ejemplo). Los validadores viven en `src/_lib/validadores.js` (módulo puro, reexportado por `content.js`). No valida `hero.cta_enlace` ni `imagen_fondo_url`.

## 7. API y autenticación

| Ruta | Auth | Contrato |
|---|---|---|
| `GET /api/content?key=...` | pública | 200 JSON; 404 si no existe; keys `config`, `catalogo`, `landing`, `faq`. |
| `PUT /api/content?key=...` | cookie `admin_session` | Valida schema y hace `KV.put`; 200 `{ok,updated_at}`; 400 `{error,detalle}`; 401. |
| `POST /api/login` | pública | Body `{password}`; 200 `{ok:true, aviso?}` + `Set-Cookie` (`aviso` si `ADMIN_PASSWORD` tiene <12 caracteres); 401; 429 tras 5 fallos en 15 min por IP (`Retry-After`). |
| `POST /api/logout` | cookie | 200 `{ok:true}`; borra la cookie. |
| `GET /api/session` | cookie | 200 `{authenticated:true}`; 401 si no hay sesión válida. |
| `POST /api/upload` | cookie `admin_session` | `multipart/form-data` con `id` y `file`; ≤5 MB; JPEG/PNG/WebP; item debe existir; guarda `items/{id}.{ext}` y borra extensiones viejas. Con `id` = `{servicio}-g{n}` (n 1–6) guarda una foto de la galería de ese servicio; 400 si el item base es un producto. |
| `GET /api/defaults?key=...` | pública | 200 con el `config/*.example.json` de esa key (importado en el bundle); 400 si la key no es válida. Solo lectura: no escribe en KV. |
| `GET /api/image?id=...` o `?url=items/...` | pública | 200 imagen desde KV; 404 si no existe o el id es inválido. |

- Cookie esperada: `admin_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`.
- Implementado en `src/_lib/auth.js`: cookie firmada con HMAC-SHA256 usando `ADMIN_PASSWORD` como secreto; el middleware verifica `/admin/*` (excepto `/admin`, `/admin/` y `/admin/index.html`) y las escrituras. No hay sesiones en KV. Los intentos fallidos de login sí se guardan en KV (`intentos:{ip}`, TTL 15 min, `_lib/intentos.js`): solo se escribe al fallar y no se escribe más con la IP bloqueada, para no gastar las 1.000 escrituras diarias.
- `window.admin.isAuthenticated()` es asíncrona; en las páginas admin debe usarse con `await`.
- **Tarjeta vs. ficha:** la tarjeta de la portada es un resumen (foto, nombre, descripción cortada a 2 líneas, precio, duración y una acción). **Solo las tarjetas de servicio llevan a la ficha** (`producto.html`; el enlace del título se estira con `h3 a::after` y la acción queda por encima, con `pointer-events` solo en el botón): allí viven la descripción completa, la galería, «Qué incluye», las opciones de precio y la reserva. **Las tarjetas de producto son estáticas** (`.item-card-estatica`: sin enlace, sin elevación ni sombra al pasar el ratón), porque su ficha mostraría lo mismo que la tarjeta; `/producto/{id}` sigue existiendo para compartir, SEO, sitemap y el carrito. El precio, la duración y el botón van siempre pegados al fondo de la tarjeta (`.item-meta` con `margin-top: auto`), para que se alineen aunque el título ocupe una o dos líneas. En servicios, al pasar el ratón la tarjeta sube 4 px (`--card-lift`) y aparece una sombra suave (`--shadow-hover`); ya no hay overlay «Ver detalles». Tarjetas redondeadas (`--radius-card` 20px) con fondo tenue (`--card-tint`; en blanco sobre fondos grises). No repitas en la tarjeta lo que ya está en la ficha de un servicio.
- **Compartir:** la ficha lleva una línea discreta «Compartir: WhatsApp · Copiar enlace» (`prepararCompartir` en `producto.html`; `wa.me/?text=` con nombre y URL, y copia al portapapeles). No va en las tarjetas ni como botón.
- **Servicios a cotizar:** `app.js` expone `requiereCotizacion`, `textoPrecio` y `buildCotizacionLink`. Las tarjetas muestran el precio también en servicios. El admin de Catálogo tiene la casilla «Precio a consultar» (solo se habilita en servicios).
- **CTA del hero:** es un solo botón (`landing.hero.cta_texto/cta_enlace`). El ejemplo apunta a `/#seccion-servicio`, porque en un negocio mixto los productos ya quedan a la vista bajo el hero. `ajustarCta()` en `index.html` lo oculta si el destino `#...` no existe o está oculto (p. ej. solo-productos).
- **Caché y límites gratuitos:** cada visita a una página pública es 1 invocación de función (la de la página) más 1 por foto; no pide `/api/content` porque `src/_lib/paginas.js` inyecta los datos en `<script id="sitio-datos">` y `app.js` los lee de ahí (`/api/content` queda como respaldo). Las lecturas de KV pasan por la Cache API de borde 60 s (`_lib/cache.js`), se invalidan al hacer PUT/upload en ese centro de datos y las demás caducan solas; las fotos se cachean 5 min en el borde y 1 h en el navegador. La Cache API puede no aplicar en `*.pages.dev` (sí con dominio propio); sin caché todo funciona leyendo KV. El admin lee con `cache: 'no-store'`. Los cambios pueden tardar hasta ~60 s en verse.
- **Longitud de títulos y descripciones:** `etiquetasMeta` recorta la descripción (meta, Open Graph y Twitter) a 155 caracteres en límite de palabra con «…» (`recortar`, `_lib/seo.js`); los títulos automáticos de ficha y FAQ usan `tituloPagina`: «Página - Negocio» y, si pasa de 60, solo la parte de la página. El título de la portada (`landing.seo.titulo`) no se toca. `aplicarMarca` ya no añade el nombre al `document.title` en páginas con `#sitio-datos`, porque el servidor decide el título.
- **Open Graph:** `og:locale` sale de la moneda del perfil (`localeOg`: PEN→es_PE, MXN→es_MX, COP→es_CO, ARS→es_AR, CLP→es_CL, EUR→es_ES; otra, como USD→es_LA). `og:image:alt`/`twitter:image:alt` los pone cada página con `imagenAlt` (nombre del item si hay foto; «Logo de …» si es el logo). `hreflang` no hace falta con un solo idioma.
- **URLs de ficha:** URL limpia `/servicio/{id}` para servicios y `/producto/{id}` para productos (`src/servicio/[id].js` y `src/producto/[id].js`; sirven `producto.html` con `env.ASSETS.fetch('/producto')`, por eso `producto.html` usa rutas absolutas y lee el id de la ruta). La URL antigua `/producto?id=…` (`src/producto.js`) redirige 301 a la nueva, y cada ruta redirige también si el item es de otro tipo; id inexistente: 404 `noindex`. Un solo origen de verdad para la ruta: `urlFicha` (`app.js`) en cliente y `rutaItem` (`_lib/seo.js`) en servidor (canonical, sitemap, lista estática, enlaces). La lógica de la ficha vive en `_lib/ficha.js` (`fichaPublica({ tipo })`).
- **HTML visible para buscadores:** `paginaPublica` acepta `meta().reescribir(rw)` para añadir reglas de `HTMLRewriter`. La portada recibe `h1` y subtítulo del hero reales y un bloque `#catalogo-estatico` (lista de items, `_lib/seo.js`) que `renderizarCatalogo` retira al pintar las tarjetas; la ficha recibe `h1#producto-nombre`, descripción y `alt` de la foto. `test/seo.test.mjs` cubre el bloque.
- **SEO y compartir:** `/`, `/faq`, `/servicio/{id}`, `/producto/{id}` y `/carrito` pasan por `paginaPublica()`, que inyecta título, descripción, canonical, Open Graph/Twitter y JSON-LD (WebSite+Organization —o LocalBusiness solo si hay `perfil.direccion` (`address`, que Google exige para negocio local); `areaServed` (zonas de servicios no solo online, `zonasAtendidas`) va en ambos casos, ver `zonasAtendidas` en `_lib/seo.js`—, FAQPage, Product/Service). `og:image` es la foto del item (si existe) o `negocio.logo_url`; si no hay ninguna, sin imagen. Un id inexistente responde 404 con `noindex`; el carrito y el admin llevan `noindex`. `/sitemap.xml` (home, FAQ y cada item con `disponible !== false`; la ficha de un item no disponible sigue respondiendo 200 con `OutOfStock`) y `/robots.txt` son dinámicos. `PUT /api/content` guarda `updated_at` en la metadata del KV (no en el JSON) y el sitemap lo usa como `<lastmod>` (home: el más reciente de config/catálogo/landing; FAQ: config/faq; items: config/catálogo, sin fecha por item); las keys nunca guardadas van sin `<lastmod>`. Para que la vista previa de WhatsApp muestre la foto, mantenla ligera (≲300 KB).
- **Sitio recién desplegado:** `app.js` (`loadCatalogo/loadConfig/loadLanding/loadFAQ`, memoizadas) cae a `/api/defaults` cuando la key no existe en KV, así las páginas públicas muestran los ejemplos sin guardar nada. En cuanto el admin guarda una key, se usa la guardada.
- **Diseño visual (rediseño 2026-10-29):** referencia de limpieza: fondo blanco, mucho aire, una sola tipografía, bordes finos y sin sombras. `--bg` es blanco y `--bg-alt` (#F6F7F9) alterna secciones; el hero es claro y centrado (con `imagen_fondo_url` pasa a texto blanco vía la clase `hero-imagen`); cada tarjeta lleva **una sola acción** con botón blanco de borde fino (se oscurece al pasar el cursor) y la acción principal de la página (hero, ficha, carrito, contacto) usa el acento relleno. La tipografía es **Inter variable alojada en `public/assets/fonts/`** (latin, 48 KB, licencia OFL en `Inter-OFL.txt`; precargada en las 4 páginas públicas; `FUENTES.sans` de `app.js` la pone primero). Sin emojis como iconos: el carrito de la navegación es un enlace (`a.carrito-icon`) con SVG y el pie usa enlaces de texto; la navegación no repite «Carrito» como enlace. `placeholder.png` es un gris neutro con icono de imagen. Texto con `text-wrap: balance`. Los campos de formulario heredan la fuente. Contrastes verificados AA (`--muted` 6.0:1 sobre blanco).
- **Paleta y acento:** `styles.css` define la paleta de Capa Gratuita como variables (`--primary` #12161C, `--accent` #B6F23C, `--bg`, `--ink`, `--ok`…). Solo el acento es configurable: `landing.tema.color_acento` (`#rrggbb`, opcional) reemplaza `--accent`. Se usa de fondo de botones con texto `--ink`, así que el validador exige contraste ≥ 4.5:1 con `#12161C` (mensaje accionable) y el admin lo avisa en vivo. El servidor lo inyecta en `<head>` (`paginas.js`) para evitar parpadeo; `app.js` (`aplicarTema`) lo repite. `color_primario/color_secundario` ya no se piden ni se guardan (se aceptan y se ignoran si vienen en datos antiguos). `landing.tema.fuente` y `landing.tema.estilo` sí se aplican. El estilo (`moderno` base, `minimalista`, `rustico`, `elegante`) cambia radios, sombras, tipografía de títulos y espaciado, nunca colores. Tarjetas: `moderno` 20px con fondo tenue y sombra al hover; `minimalista` 12px, blancas, sin sombra ni elevación; `rustico` 14px con bordes marcados y sombras sólidas; `elegante` con esquinas rectas (0px) a propósito, es su rasgo distintivo: `styles.css` usa variables (`--radius-*`, `--shadow-*`, `--font-heading`) y los tres estilos no base las sobrescriben bajo `html[data-estilo="…"]`; `paginas.js` pone el atributo en `<html>` desde el servidor y `aplicarTema` lo repite. `moderno` no lleva atributo y es la base visual limpia (ver «Diseño visual»). No hardcodees colores de marca: usa las variables.
- **Tokens de estado y consistencia (2026-10-29):** `styles.css` define también `--danger/--danger-bg/--danger-line`, `--ok-bg`, `--warn/--warn-bg/--warn-line` y `--line-strong`. Ni el admin (`admin.css`, estilos inline de `catalogo.html`/`landing.html`/`respaldo.html`) ni las páginas públicas deben llevar hex sueltos: usa estos tokens y `--ink-soft`, `--muted`, `--line`, `--bg-alt`; los radios van con `--radius-btn/--radius-box/--radius-pill` para que el estilo del tema también afecte al admin. La notificación temporal (carrito, copiar enlace) es la clase `.notificacion` (con `@keyframes slideUp`) en `styles.css`; las páginas solo crean el `div` y no ponen estilos en línea. Mosaico: las fotos (1200×900) pueden traer texto incrustado, así que el recorte de `object-fit: cover` en casillas verticales es esperado; `.mosaico-tile` lleva `font-size: 0` para no pintar el `alt` mientras carga.
- **Primer arranque sin terminal:** si una key no existe en KV, `admin.getContent` cae a `/api/defaults` y muestra un aviso de datos de ejemplo; no se guarda nada hasta que el admin pulse Guardar (`PUT /api/content`). `admin/respaldo.html` exporta/importa las 4 keys en un solo JSON (las fotos no van incluidas; se suben desde `fotos.html`). `admin.js` inyecta la barra de navegación del admin, en este orden: General (`identidad.html`, la URL no cambió), Mi página (`landing.html`), Mi catálogo (`catalogo.html`), FAQ, Respaldo. `/admin/fotos` redirige a Catálogo (`public/_redirects`); la foto de cada item se sube desde su fila en Catálogo. Pages sirve `/admin/identidad` sin `.html`.

## 8. Convenciones de frontend

- Cada página es HTML completo. Las públicas cargan `/assets/app.js`; las admin cargan `../assets/admin.js` antes de su script inline.
- El admin de Catálogo tiene pestañas globales Productos / Servicios (con contador) que filtran a la vez las categorías y los items; cada item nace con el tipo de la pestaña activa (su campo Tipo va oculto), cada categoría nace con su tipo y los selectores de categoría de cada item se filtran por el tipo del item. Ya no existe la tabla «Validación del Catálogo».
- `assets/app.js` expone `window.app`: `fetchJSON`, `loadCatalogo`, `loadConfig` (memoizada), `aplicarMarca`, `textoDireccion`, `loadLanding`, `loadFAQ`, `renderItem`, `buildWhatsAppLink`, `formatPrecio`, `getCarrito`, `saveCarrito`, `addToCarrito`, `getCarritoTotal`, `getCarritoItemsCount`.
- `assets/admin.js` expone `window.admin`: `login`, `isAuthenticated` (async), `getContent`, `putContent`, `exportarTodo`, `importarTodo`, `logout` (async). No expone `getToken`; la sesión viaja en cookie.
- Carrito real en `localStorage` bajo `carrito`: `[{id, nombre, precio, moneda, cantidad}]` (no solo `{id,cantidad}`; la UI lee nombre/precio). El checkout arma el mensaje con nombre, cantidad, precio y total.
- WhatsApp: `https://wa.me/{config.perfil.whatsapp}?text=${encodeURIComponent(mensaje)}`, o el enlace de `api.whatsapp.com` si hay `whatsapp_usuario` (siempre vía `buildWhatsAppLink`; `tieneWhatsApp` indica si hay alguno).
- `producto.html` y `carrito.html` usan `config.perfil.moneda`/`formatPrecio`; si agregas precios nuevos, no hardcodees `PEN` ni `S/.`.
- **Una sola acción por oferta** (`accionItem(item, config, catalogo)` en `app.js`): los servicios nunca van al carrito. Precio a consultar → «Consultar por WhatsApp» (cotización); categoría en `categorias_agendamiento` con enlace de reserva propio o global → «Reservar Cita»; el resto → «Consultar por WhatsApp» (disponibilidad). Los productos usan el carrito. `tipo_catalogo: solo-servicios` oculta el carrito (icono y enlaces, vía `aplicarCarrito`), y `/carrito` muestra un aviso; `carrito.html` descarta servicios que hubieran quedado en `localStorage`.

## 9. Imágenes (KV `IMAGES`)

- La convención es `items/{id}.{ext}` y el item debe existir en `catalogo`: el guardado en KV o, mientras no se haya guardado ninguno, el de ejemplo (`src/_lib/defaults.js`, `getContent`). Al guardar un catálogo propio, solo valen sus IDs.
- Usa el binding: `await env.IMAGES.put(key, body, { metadata: { contentType: file.type } })` y lee con `getWithMetadata(key, { type: 'arrayBuffer' })`. Límites del KV gratuito: 1 GB, 1.000 escrituras/día, 100.000 lecturas/día, 25 MiB por valor (el tope de subida es 5 MB). Una foto nueva puede tardar hasta ~60 s en verse en otros puntos de la red (consistencia eventual).
- `GET /api/image?id={id}` busca `items/{id}.jpg|jpeg|png|webp`; `GET /api/image?url=items/{id}.{ext}` sirve una key exacta. La ruta es pública y cachea 1 hora.
- Al subir una imagen se borran las otras extensiones del mismo `id` para evitar servir una foto vieja.
- El admin (`catalogo.html` y `landing.html` vía `admin.subirFoto`, que usa `admin.optimizarImagen`) convierte cada foto en el navegador a **JPEG de hasta 1200 px y ~250 KB** antes de subirla (acepta originales de hasta 25 MB); el servidor no redimensiona y solo valida tipo y 5 MB. Motivo: la vista previa de WhatsApp no muestra `og:image` en WebP ni con pesos grandes (Telegram sí). Las fotos subidas antes de este cambio siguen en su formato original: hay que volver a subirlas. La portada muestra la foto en cada tarjeta (`.item-imagen`, 4:3, `object-fit: cover`) y cae a `assets/images/placeholder.png` si `/api/image` responde 404; la ficha usa un recuadro de 400px (300px en móvil).
- **Galería de servicios:** solo servicios, hasta 6 fotos extra además de la principal. Cada foto se guarda como `items/{id}-g{n}.{ext}` (n 1–6) con `POST /api/upload` (`id` = `{servicio}-g{n}`) y se sirve con `/api/image?id={id}-g{n}`; no cambió `image.js`. El catálogo guarda `galeria: [{n, alt≤100?}]`; el orden del array es el de la ficha. El validador (`ID_GALERIA`, `MAX_GALERIA` en `validadores.js`) rechaza `galeria` en productos, `n` fuera de 1–6 o repetido, y ids de item del tipo `x-g1` cuando existe `x`. El admin la edita en «Detalles del servicio» («Galería de fotos»: miniaturas con descripción, ◀ ▶, «Quitar» y «+ Añadir foto»; la subida es inmediata y solo se activa con el servicio guardado; el orden y los textos se guardan con «Guardar catálogo»). Quitar una foto no borra el archivo del KV (las fotos solo se escriben desde `/api/upload`); se sobrescribe al reutilizar ese hueco. En la ficha (`renderizarMosaico` en `producto.html`, bloque «Mosaico» de `styles.css`): foto principal grande y hasta 4 extras en cuadrícula (`.mosaico-eN` según cuántas), «+N» en la última si sobran y un `<dialog>` a pantalla completa (flechas, teclado, Esc, contador). Sin `galeria` la ficha se ve como siempre.
- **Orden de items en el admin:** cada item de Catálogo tiene «↑ Subir» / «↓ Bajar» y «Posición n de m»; mueven dentro de su tipo y el orden del DOM es el que se guarda. La foto va en una columna lateral y «Eliminar» en la cabecera de la card.
- No hay campo `imagen_url` en el catálogo: la URL se construye desde `id`. El botón «Subir foto» de cada fila solo se activa si el `id` ya está guardado en el catálogo (`/api/upload` rechaza ids inexistentes; hay que guardar antes de subir); la ficha usa `/api/image?id=...`.
- Las fotos no tienen URL pública directa: se sirven siempre por `/api/image`. `landing.hero.imagen_fondo_url` con URLs `r2.dev` se ignora.

## 10. Reparación y roadmap

**Reparación completada:**

1. `upload.js` usa `env.IMAGES.put` (KV), sin SDK ni credenciales.
2. Auth HMAC en `_lib/auth.js`; middleware protege admin y escrituras.
3. `app.js`/`admin.js` conectados; CSS de admin y placeholder corregidos.
4. Validadores nullables y refuerzos del catálogo implementados.
5. Imagen unificada: subida -> `items/{id}.{ext}` -> `GET /api/image`.
6. KV sembrado y flujo probado con `npm run dev` + curl.

**Fases pendientes (plan de 6 fases, 2026-10-29):** las fases 1–5 están hechas (servicios sin carrito, modelo de servicio, identidad y confianza, reserva genérica y analítica, seguridad y calidad). La fase 6 (documentación) está escrita (`docs/guia-paso-a-paso.md`, `README.md`, `docs/e2e-checklist.md`, `docs/friction-log.md`) pero **falta validarla con una persona ajena** y pasar el checklist en un navegador real. `config/claude-prompts.md` y `docs/video-script.md` quedan descartados salvo que se pidan.

## 10b. Despliegue con el botón «Deploy to Cloudflare» (verificado 2026-10-30)

Lo observado en pruebas reales (cuentas de Cloudflare y GitHub limpias); no hay documentación oficial que lo respalde, así que si Cloudflare cambia el asistente hay que repetirlo.

- **El botón no hace fork:** Cloudflare clona `capagratuita/catalogo-personal`, sobrescribe archivos y sube una copia nueva a la cuenta de GitHub de la persona (historial distinto) y crea el Worker con Workers Builds (comando de deploy `npm run deploy` = `wrangler deploy`). Un build creado así no se puede reintentar («seed_repo override»): para redesplegar hace falta un commit.
- **Formato de la configuración:** con `wrangler.jsonc` el asistente crea los KV con los nombres escritos en el formulario y escribe sus `id` en el repo (los siguientes builds salen sin «Provisioning»). Con `wrangler.toml` no los enlazaba y `wrangler deploy` creaba otros (`<worker>-kv`, `<worker>-images`). No vuelvas a TOML.
- **Nombre del proyecto:** se puede cambiar en el formulario (probado con `mi-portafolio`): el asistente renombra el repo de GitHub, el `"name"` de `wrangler.jsonc` (deducido: `wrangler deploy` no recibe `--name`) y el `name` de `package.json`; el Worker y la URL usan el nombre nuevo. Los KV se crean con los nombres del formulario y quedan enlazados. El workflow de sincronización conserva ese `name` en `package.json` y `package-lock.json` (pasos «Recordar/Conservar el nombre de tu proyecto», con `jq`); probado en local, aún no ejecutado en GitHub.
- **Nombres de KV:** los dos campos del formulario traen el mismo nombre por defecto (el del Worker) y el despliegue falla («title already exists»). La guía pide dos nombres distintos (`catalogo-datos`, `catalogo-fotos`). Un intento fallido deja KV sobrantes: bórralos antes de repetir. Un nombre igual al automático de Wrangler (`<worker>-kv`/`-images`) daba el error 10014.
- **Secreto:** `ADMIN_PASSWORD` se pide en el formulario por `.dev.vars.example` y queda guardado aunque el primer despliegue falle.
- **`.github/` no se copia:** el workflow `sincronizar-template.yml` se instala a mano una vez (guía, «Cómo traer mejoras del template»). Copia los archivos del template sobre el repo (no `merge`: no comparten historial), excluye `wrangler.jsonc`, `wrangler.toml`, `.github/`, `.dev.vars` y `node_modules`, avisa si `wrangler.jsonc` cambió salvo en los `id`, sube la rama `sincronizar-template` y abre un PR. Sin el ajuste *Allow GitHub Actions to create and approve pull requests* no puede crearlo y deja un enlace en el resumen de la ejecución. Ejecutado con éxito en un repo de prueba (rama + enlace + PR manual + merge + redeploy con los mismos KV). Si el workflow cambia en el template, hay que volver a copiarlo.
- **URLs de vista previa:** `preview_urls = false` y `workers_dev = true` en `wrangler.jsonc` (las vistas previas compartirían KV y contraseña con producción).
- **Licencia:** AGPL-3.0-only (`LICENSE`); el nombre y el logo no están incluidos.

## 11. Criterios de aceptación

- Un fork limpio arranca en local con `npm run dev`; para desplegar, configura los dos namespaces KV y autentica Wrangler.
- No hay tokens ni credenciales en el repo.
- Flujo local: login -> editar config/catálogo/landing/faq -> subir foto -> ver en ficha -> carrito (productos) / consultar o reservar (servicios) -> WhatsApp o enlace de reserva.
- 375px y desktop; errores en español con mensaje accionable.
- El sistema funciona en la capa gratuita de Cloudflare.

## 12. Al trabajar en este repo

- Lee la sección 1 antes de asumir que algo funciona.
- Si tocas `wrangler.jsonc` o el script `dev`, respeta las reglas 11 y 12.
- Si necesitas D1, tokens o commits automáticos, detente y pregunta.
- Mantén `AGENTS.md`, `AGENTS_SUMMARY.md` y `VALIDATION_SUMMARY.md` sincronizados con el estado real.

## 13. Continuar pruebas en otra sesión

- La memoria de trabajo está en `AGENTS_SUMMARY.md` y el log de pruebas en `VALIDATION_SUMMARY.md`.
- Estado de partida: `npm run dev` escucha en `0.0.0.0:8788`; LAN `http://192.168.11.104:8788` (la IP puede cambiar; usa `hostname -I`). Las 4 keys KV están sembradas y el KV local `IMAGES` tiene las 5 fotos.
- Para retomar: `cd /home/devops/proyectos/catalogo-personal`, libera el puerto con `lsof -t -iTCP:8788 -sTCP:LISTEN | xargs -r kill`, ejecuta `npm run dev` y abre `http://localhost:8788` o la IP LAN.
- Si `.wrangler/state` se borra, vuelve a sembrar KV con los comandos de la sección 4.
- Pruebas pendientes: checkboxes de `categorias_agendamiento` (servicio agendable oculta carrito), 375px/escritorio, y actualizar `README.md`.
