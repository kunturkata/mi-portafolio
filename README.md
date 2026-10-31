# Catálogo personal en Cloudflare

Template para publicar **un catálogo de tus servicios** (y, como extra, algunos productos) con tu propia dirección web, sin servidor ni costos fijos. Pensado para profesionales independientes, emprendedores y proyectos personales o de hobby o experimentación.

**No es una tienda online** ni compite con Shopify o WooCommerce: no hay pasarela de pago, stock, impuestos ni envíos. Quien te visita te consulta o reserva, y el cobro lo acuerdas tú.

Cada persona hace su propio fork y despliega su propia instancia. No es un SaaS multi-inquilino.

## Qué incluye

- **Servicios:** precio fijo, «Desde X» o «Precio a consultar»; duración, modalidad (online/presencial), zona, qué incluye y opciones de precio (sesión suelta, packs).
- **Una sola acción por servicio:** «Reservar Cita» (Calendly, Cal.com, Google Calendar…) o «Consultar por WhatsApp». Los servicios no usan carrito.
- **Productos (extra):** carrito sencillo que arma una consulta por WhatsApp. Se oculta si el tipo de catálogo es «Solo servicios» (el valor por defecto).
- **Tipo de catálogo:** solo servicios, solo productos o mixto, desde General.
- **Portada editable:** portada, textos, destacados, galería, *Sobre mí* con foto, testimonios, contacto y color de acento propio.
- **FAQ**, **SEO** (título, descripción, vista previa al compartir, datos estructurados, sitemap) y analítica opcional sin cookies (Cloudflare Web Analytics).
- **Panel de administración** protegido con contraseña, con límite de intentos, respaldo y subida de fotos optimizadas.
- Frontend en HTML, CSS y JavaScript puros; todo en la capa gratuita de Cloudflare (Workers con archivos estáticos y Workers KV).

## Publicar tu sitio

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/capagratuita/catalogo-personal)

El botón copia el proyecto a tu GitHub, crea los dos almacenes KV y despliega el Worker. Sigue **[docs/guia-paso-a-paso.md](docs/guia-paso-a-paso.md)**: sin terminal, unos 15–30 minutos. Para traer mejoras del template después, instala una vez el workflow *Sincronizar con el template* (el botón no copia `.github/`; la guía explica cómo) y ejecútalo a mano desde la pestaña Actions.

## Probarlo en tu computador

Requiere [Node.js](https://nodejs.org) reciente (probado con la versión 22).

```bash
npm install
cp .dev.vars.example .dev.vars   # y escribe tu clave en ADMIN_PASSWORD=
npm run dev
```

Abre `http://localhost:8788` (el panel está en `/admin`). Sin guardar nada, el sitio muestra datos de ejemplo; en local, KV se simula automáticamente y no necesitas iniciar sesión en Cloudflare.

Para abrirlo desde el celular en la misma red, usa la IP de tu computador: `http://<IP>:8788`.

## Pruebas

```bash
npm test
```

Ejecuta las pruebas de los validadores, del límite de intentos de login y de la lógica de acciones del frontend. No reemplazan la prueba en el navegador: usa [docs/e2e-checklist.md](docs/e2e-checklist.md).

## Cómo está hecho

| Capa | Servicio |
|---|---|
| Páginas | Workers Static Assets (`public/`) |
| API y páginas con SEO | Worker (`src/worker.js`, rutas en `src/`) |
| Contenido | Workers KV (`config`, `catalogo`, `landing`, `faq`) |
| Fotos | Workers KV, namespace aparte (`IMAGES`) |
| Acceso al panel | Cookie firmada con `ADMIN_PASSWORD` |

El contenido vive en KV, no en el repositorio. Los ejemplos de `config/*.example.json` se muestran hasta que guardas tu propio contenido desde el panel.

Reglas del proyecto y contratos de datos: [AGENTS.md](AGENTS.md).

## Licencia

[GNU AGPL-3.0](LICENSE). Puedes usarlo y modificarlo libremente, también para tu negocio. Si publicas una versión modificada como servicio en red, debes ofrecer su código fuente a quienes lo usen, bajo la misma licencia. El nombre y el logo del proyecto no están incluidos en la licencia.
