# Memoria de sesión — Catálogo Personal

**Fecha:** 2026-10-29
**Ruta:** `/Users/guillermo/Capa Gratuita/catalogo-personal`
**Objetivo:** continuar sin repetir el diagnóstico. Detalle técnico en `AGENTS.md`; log de pruebas en `VALIDATION_SUMMARY.md`.

## Qué se hizo (plan de 6 fases, tras el análisis de posicionamiento)

1. **Servicios sin carrito:** `accionItem` en `app.js` decide una sola acción por oferta; el carrito se oculta en `solo-servicios`.
2. **Modelo de servicio:** `modalidad`, `zona`, `incluye`, `variantes`; validadores en `functions/_lib/validadores.js` (módulo puro) con email/URLs y `items_ids`.
3. **Identidad y confianza:** `landing.secciones` ahora se pinta (antes no se mostraba); secciones `sobre-mi` y `testimonios`; `color_acento` con contraste AA; foto de «Sobre mí» con id reservado.
4. **Reserva genérica y analítica:** `reserva_url` (lee `calendly_url` antiguo); token de Cloudflare Web Analytics.
5. **Seguridad y calidad:** límite de intentos de login; `npm test` (hoy 34 pruebas); se eliminaron `validate-phase*.sh`.
6. **Documentación:** `docs/guia-paso-a-paso.md`, `README.md`, `docs/e2e-checklist.md`, `docs/friction-log.md`.

## Reorientación a catálogo personal (2026-10-29)

- El producto es un catálogo de uso personal (profesional, emprendimiento, hobby), no un ecommerce: se cambiaron textos del admin, `README.md` y la guía («negocio», «cliente», «pedido» → lenguaje de catálogo/consulta).
- General del admin: «Modo del Negocio» pasó a **«Tipo de catálogo»**, con «Solo servicios» primero y como valor por defecto del formulario. `config/config.example.json` sigue en `mixto` a propósito (con `solo-servicios` los productos de ejemplo quedarían sin acción).
- Refactor de datos: `config.negocio` → **`config.perfil`** y `modo_negocio` → **`tipo_catalogo`**. `normalizarConfig` (`functions/_lib/validadores.js`) traduce los datos antiguos al leer (`getContent`, `GET /api/content`) y al guardar (`PUT /api/content`), así que el KV existente y los respaldos viejos siguen funcionando sin migrar.
- Redes: `perfil.redes.tiktok` y `perfil.redes.youtube` (opcionales; admin, pie de las 4 páginas públicas y `sameAs` del JSON-LD).
- «Tono del Chat» se quitó de General.
- Commits: `5f9c869` (refactor y textos), `5ae4b36` (redes y tono del chat).

## Admin de Portada: pestañas en dos niveles (2026-10-29)

- `admin/landing.html`: selector de nivel 1 `Portada | Apariencia y SEO | Secciones (n)` (ancho completo, sin scroll en móvil). Dentro de «Secciones» hay una cabecera fija con «+ Añadir sección» (antes estaba al final de la cinta, oculto en móvil) y una cinta de nivel 2 con una pestaña por sección.
- La cinta de secciones no muestra scroll vertical (`overflow-y: hidden`) y la pestaña lleva solo el nombre, sin el tipo. «Secciones» abre la última sección vista; sin secciones muestra un aviso; al eliminar una sección se vuelve a «Secciones». Las flechas/Inicio/Fin navegan dentro de cada fila.
- El tipo `texto` se llama ahora **«Mensaje»** en el admin (desplegable, selector de alta, encabezado, título propuesto y etiqueta del campo). El valor guardado sigue siendo `texto`.
- Commits: `e53827a`, `cf6cdab`, `6e2bd96`, `3ea1c0a`.
- **Arte de las secciones de la portada pública** (`44e4992`): línea de acento bajo cada título; título y texto siempre centrados en `texto`/`sobre-mi`/`contacto` (se quitó la alineación a la izquierda y el cambio de layout de `sobre-mi` a 768px, que hacía que cambiara de alineación según el ancho); `contacto` centrado (antes texto a la izquierda y botones centrados) con botones iguales en móvil; `sobre-mi` con marco de acento e iniciales si no hay foto; `testimonios` con comilla, avatar de iniciales y deslizables en móvil. Revisado en Chromium a 375px y 1200px en los 4 estilos (cambiando `data-estilo` en el navegador). Correcciones tras la revisión: frase introductoria de `destacados`/`galeria` centrada (solo `.container > p`, no las descripciones de tarjetas) y barra de `rustico` sin mezclarse con su doble línea . Pendiente: títulos largos en `elegante` (mayúsculas) a 375px.
- **«Sobre mí» con foto real** (2026-10-29): probada subiendo una foto del catálogo local (819×1024 y 600×800) por el editor, en los 4 estilos a 375px y 1000px: círculo recortado sin deformar, centrado, marco de acento y firma bien; sin errores de consola. Foto de prueba borrada del KV local. Pendiente: un retrato real, porque el recorte circular centra la foto y podría cortar una cara muy alta (opción: `object-position: center 25%`).
- Sin probar en navegador real (ni en 375px).
- **Foto de «Sobre mí» desde la sección:** el editor de la sección tiene «Tu foto» (vista previa circular, selector y «Subir foto»). Sube al momento por `/api/upload` con id `sobre-mi` (no depende de «Guardar Portada»). Probado en Chromium a 375px; la foto de prueba se borró del KV local. No hay botón para quitar la foto (no existe endpoint de borrado).
- **Campo «Tu nombre» en `sobre-mi`** (`secciones[].nombre`, ≤60, solo ese tipo; validador, editor y 3 pruebas nuevas): se muestra como firma y de él salen las iniciales sin foto. Antes las iniciales salían de `perfil.nombre` (nombre del negocio) y no coincidían con la persona; sin nombre y sin foto ahora solo se ve el texto. Probado en Chromium: con nombre → «LP» + firma; vacío → sin círculo.
- **Datos de prueba:** el KV local `landing` tiene una portada ficticia con los 6 tipos (Mensaje con `posicion: antes`, Destacados, Galería, Sobre mí, Testimonios con 3 opiniones inventadas, Contacto) sobre el catálogo de panadería. Solo está en `.wrangler/state`; `landing.example.json` sigue sin testimonios a propósito. Pasa `validateLanding`.

## Fotos dentro de Catálogo (2026-10-29)
- Se eliminó `admin/fotos.html`; cada fila de Catálogo tiene miniatura y «Subir foto» (`admin.subirFoto`, compartido con la foto de «Sobre mí»). El botón solo se activa si el `id` ya está guardado. `/admin/fotos` redirige a Catálogo (`public/_redirects`). Catálogo: pestañas globales Productos/Servicios filtran categorías e items (Tipo oculto en la fila); se quitó la tabla «Validación del Catálogo». Cada campo de la fila lleva una etiqueta sutil (`label.campo > span`); las filas de opciones de precio siguen solo con placeholder. El ID está en la fila de Categoría y se autogenera del nombre (slug; `item-N` si no hay nombre) solo en items sin guardar y sin edición manual; vaciarlo lo regenera. Los campos que no aplican al tipo (duración, reserva, «Precio a consultar», detalles) se ocultan, no se deshabilitan; al lado del precio se muestra la moneda de General (solo lectura).

## Catálogo: orden, galería de servicios y tarjetas de producto (2026-10-29)
- Admin de Catálogo: foto en columna lateral, «Eliminar» en la cabecera de la card y botones Subir/Bajar para ordenar items dentro de su tipo.
- Galería de servicios: `galeria[{n,alt}]` (≤6), fotos en `items/{id}-g{n}.{ext}` vía `/api/upload`; mosaico asimétrico y visor en `producto.html`; editor en «Detalles del servicio». Detalle en AGENTS.md sección 9.
- Las tarjetas de producto ya no enlazan a la ficha (sería lo mismo) y muestran la descripción a 2 líneas; las de servicio sí.
- El KV local tiene los dos servicios (`taller-masa-madre`, `asesoria-pan`) poblados con datos e imágenes ficticias generadas con Pillow.

## Estado y pendientes

- Todo está commiteado en `main`.
- Las pruebas de UI se hicieron con jsdom contra `npm run dev`; no hay Chrome en esta máquina. Falta pasar `docs/e2e-checklist.md` en un navegador real a 375px.
- El despliegue real en Cloudflare con la guía **no se ha probado**. Falta una persona ajena que la siga (`docs/friction-log.md`).
- Pendiente de la reorientación: la barra del admin sigue diciendo «Landing»; `identidad.html` conserva su nombre de archivo; la reorientación no se revisó a ojo en navegador.
- El chat con IA se eliminó por completo (2026-10-30): sin `/api/chat`, sin `[ai]`, sin `tono_chat`/`tono` (los datos antiguos con esos campos se aceptan y se ignoran).
- El KV local tiene un catálogo de panadería de pruebas (no el de ejemplo) y la clave `intentos:127.0.0.1` se borró tras probar el bloqueo.

## Cómo retomar

```bash
cd "/Users/guillermo/Capa Gratuita/catalogo-personal"
lsof -t -iTCP:8788 -sTCP:LISTEN | xargs -r kill
npm run dev      # si cae con SQLITE_BUSY tras editar archivos, reiniciarlo
npm test
npm run test:integracion   # servidor temporal; con BASE_URL=… prueba un despliegue en solo lectura
```

Si `.wrangler/state` se borra, volver a sembrar KV:

```bash
npx wrangler kv key put --binding=KV --local config   --path=config/config.example.json
npx wrangler kv key put --binding=KV --local catalogo --path=config/catalogo.example.json
npx wrangler kv key put --binding=KV --local landing  --path=config/landing.example.json
npx wrangler kv key put --binding=KV --local faq      --path=config/faq.example.json
```

En local, si bloqueas tu propia IP con contraseñas incorrectas: `npx wrangler kv key delete --binding=KV --local "intentos:127.0.0.1"`.

## Revisión de coherencia de la UI (2026-10-29)

- Hex sueltos de `admin/catalogo.html` y `admin/landing.html` (incluidos marrones de la paleta antigua), `admin.css`, `styles.css` y JS de `respaldo.html`/`landing.html` sustituidos por variables; tokens nuevos de estado en `:root`.
- Radios del admin con `--radius-*`. «+ Añadir sección» de Landing pasa al estilo primario.
- Notificación temporal duplicada en `index/producto/carrito.html` → clase `.notificacion` en `styles.css`.
- Error corregido en la sesión: un `replace` sin límite metió `animation: slideUp` en varias reglas de `styles.css` (rompió el mosaico); se deshizo. Se probó un mosaico 4:3 y se descartó: se mantiene el original.
- Pendiente: las pestañas de `catalogo.html` y `landing.html` siguen con estilos propios parecidos pero no compartidos.
- Commit: `2f166b0`.

## SEO (2026-10-29)

Evaluación del SEO y mejoras aplicadas (detalle técnico en AGENTS.md, secciones 6, 7 y 9):

- **HTML real sin JS** (`ec273db`, `31b21b0`): `paginaPublica` admite `meta().reescribir(rw)` (HTMLRewriter). Portada: `h1` y subtítulo del hero reales y un bloque `#catalogo-estatico` (lista de items, `_lib/seo.js`) oculto por CSS y visible solo con `<noscript>`; `app.js` lo retira al pintar. Ficha: `h1#producto-nombre`, descripción y `alt` en el HTML. `alt` de las fotos de tarjeta = nombre del item.
- **Sitemap** (`54407de`, `0233228`): `PUT /api/content` guarda `updated_at` en la **metadata del KV** (no en el JSON) y el sitemap lo usa como `<lastmod>`; keys nunca guardadas van sin fecha. Items con `disponible: false` no se listan (su ficha sigue en 200).
- **Negocio local** (`d2ccbd4`, `7ff2194`): JSON-LD `LocalBusiness` solo cuando hay `perfil.direccion` (`address`; Google lo exige) y `areaServed` (zonas de servicios no solo online) en `Organization` o `LocalBusiness` (admin General → «Dirección», validador, `direccionPostal`); la dirección también sale en el pie (`<address class="footer-direccion">`). `Service.areaServed` en las fichas.
- **URLs limpias** (`bcfb9b2`, `61dadd2`): `/servicio/{id}` y `/producto/{id}` (`functions/servicio/[id].js`, `functions/producto/[id].js`, lógica en `_lib/ficha.js`, HTML = `producto.html` vía `env.ASSETS`). `/producto?id=` y el tipo equivocado redirigen 301. `rutaItem` (servidor) y `urlFicha` (cliente) son la única fuente de la ruta.
- **Longitudes** (`b5c490d`): descripción a 155 caracteres, títulos de ficha/FAQ a 60 (`recortar`, `tituloPagina`). El título de la portada no se toca. `aplicarMarca` ya no reañade el negocio al `document.title`.
- **Detalles** (`d5bc3ec`): `og:image:alt`/`twitter:image:alt`, `og:locale` por moneda (`localeOg`) y `public/_headers`.
- No hecho a propósito: sitemap de imágenes, `hreflang` (un solo idioma), cambios en `robots.txt`.
- Comprobado en producción (`personal-ecommerce.pages.dev`, 2026-10-30): rutas limpias con `env.ASSETS`, redirecciones 301, 404 `noindex`, `lastmod` en el sitemap y `_headers`. Las pruebas de integración del servidor ya existen (`npm run test:integracion`, local y `BASE_URL` remoto de solo lectura; ver AGENTS.md sección 4). Pendiente: revisar a ojo en navegador el formulario «Dirección» y el pie. `npm test`: 34 pruebas.
- Si `npm run dev` cae con `SQLITE_BUSY_RECOVERY`: `pkill -f workerd; pkill -f wrangler` y volver a arrancar.

## Migración a Workers (2026-10-30)

- `functions/` → `src/`; `src/worker.js` enruta (tablas `EXACTAS`/`CON_ID`) y llama al middleware; lo no atendido cae a `env.ASSETS`. `_middleware.js` copia la respuesta antes de añadir CORS (las de ASSETS son inmutables).
- `wrangler.jsonc` (antes `.toml`): `main`, `assets` con `run_worker_first` (rutas dinámicas), KV sin `id` (auto-provisión). `package.json`: `dev` = `wrangler dev`, `deploy` = `wrangler deploy`.
- Botón probado en cuentas limpias (varias rondas, 2026-10-30): ver AGENTS.md sección 10b. Claves: `wrangler.jsonc` (no `.toml`), dos nombres de KV distintos, el botón no copia `.github/`.
- Licencia cambiada de MIT (solo declarada en README/package.json, sin archivo) a AGPL-3.0-only con `LICENSE`.
- Workflow `sincronizar-template.yml`: `checkout@v5`, `ubuntu-24.04`, enlace al PR en el resumen si GitHub no deja crearlo.
- PR automático verificado el 2026-10-31 (con el ajuste de Actions activado). El build de vista previa del PR falla por `wrangler preview` (falta `previews`): la guía pide desactivar «Enable Preview builds». El aviso «wrangler.jsonc cambió» salía siempre (por `name`/`id` de cada persona): ahora se compara la estructura con `jq`.
- **Pendiente:** (1) prueba con una persona ajena; (2) comprobar que desactivar «Enable Preview builds» quita el ❌; (3) repetir el flujo si Cloudflare cambia el asistente.

## Paquetes de inicio y secciones únicas (2026-10-31)

- `config/paquetes/{solo-servicios,solo-productos,mixto}.json`: respaldos importables con todo al máximo y texto genérico (ver AGENTS.md sección 6). Tests: `test/paquetes.test.mjs` (unitario) y `test/integracion/paquetes.test.mjs` (importa por la API real).
- Secciones únicas (`sobre-mi`, `contacto`, `testimonios`): validación en servidor (`SECCIONES_UNICAS`) y UI (opciones atenuadas con «Ya la tienes»). Los textos de la guía usan «Mensaje» (así se llama el tipo `texto` en el editor).
- Guía: nueva sección 2.0 «Empieza desde un paquete de inicio».
- **Pendiente:** revisar los paquetes con una persona (¿los textos genéricos bastan o hace falta una versión con ejemplos reales?) y probar su importación en el despliegue real.
