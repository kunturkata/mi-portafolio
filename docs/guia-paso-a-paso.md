# Guía paso a paso: publica tu catálogo en Cloudflare

Esta guía es para quien quiere publicar sus **servicios** (y, si quiere, algunos productos) sin programar. No necesitas terminal ni tarjeta de crédito: todo se hace con clics en GitHub y en Cloudflare, y cabe en la capa gratuita.

> Los nombres de los menús de Cloudflare cambian de vez en cuando. Si algo no coincide, busca la opción con un nombre parecido.

**Tiempo estimado:** 15–30 minutos la primera vez.

## Qué necesitas

- Una cuenta de [GitHub](https://github.com) (gratuita).
- Una cuenta de [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuita).
- Tu número de WhatsApp con código de país (por ejemplo `+51999999999`).
- Una contraseña larga para el panel de administración (mínimo 12 caracteres; el sitio te avisará si es más corta).

## Antes de empezar: elige la dirección de tu sitio

Sin dominio propio, tu sitio queda en `https://<nombre-del-sitio>.<tu-subdominio>.workers.dev`. Cloudflare genera tu subdominio al azar al crear la cuenta (algo como `mute-haze-3d90`). **Cámbialo antes de desplegar** para tener una dirección con sentido, por ejemplo `https://catalogo-personal.tu-nombre.workers.dev`:

1. En el dashboard de Cloudflare entra en **Workers & Pages**. En la barra lateral derecha, la tarjeta **Account details** muestra tu *Account ID* y tu **Subdomain**. Pulsa el lápiz junto al subdominio.
2. Escribe el que quieras. Cloudflare comprueba al momento si está disponible: es único en todo Cloudflare, así que si está ocupado prueba otro. Vale para todos los Workers de tu cuenta.

Si lo cambias **después** de desplegar también funciona, pero la dirección anterior deja de servir y la nueva tarda un par de minutos en tener su certificado (hasta entonces el navegador puede avisar de conexión no segura). Quien visite el enlace viejo no llegará al sitio.

## Paso 1. Despliega con un clic

1. Pulsa el botón **Deploy to Cloudflare** del [README del proyecto](../README.md) (inicia sesión en Cloudflare y en GitHub si te lo pide).
2. Desplázate hasta el final del formulario: verás los nombres de los dos almacenes de datos (KV) y el campo `ADMIN_PASSWORD`. Por defecto los dos KV traen el mismo nombre y **eso falla**. Cámbialos a dos nombres distintos entre sí, por ejemplo `catalogo-datos` (para `KV`, textos y catálogo) y `catalogo-fotos` (para `IMAGES`, fotos).
3. Cuando te pida `ADMIN_PASSWORD`, escribe tu contraseña de administrador (mínimo 12 caracteres). Es un secreto: no se guarda en GitHub.
4. Pulsa **Implementar**. Al terminar verás una dirección del tipo `https://tu-proyecto.tu-usuario.workers.dev`.

> El sitio ya funciona y muestra datos de ejemplo. Si el formulario no te pidió la contraseña, añádela en tu Worker: **Settings → Variables and Secrets → Add**, tipo **Secret**, nombre exactamente `ADMIN_PASSWORD`, y vuelve a desplegar.

Nunca pegues la contraseña en GitHub ni en ningún archivo del proyecto.

## Paso 2. Configura tu sitio

Entra en `https://tu-proyecto.tu-usuario.workers.dev/admin` e inicia sesión. En el menú del panel (General, Mi página, Mi catálogo, FAQ, Respaldo):

1. **General:** nombre, descripción corta, WhatsApp (con código de país), moneda, tipo de catálogo (*solo servicios*, *solo productos* o *mixto*), enlace de reserva si usas una agenda, y tus redes. Pulsa **Guardar**.
2. **Mi página:** el editor tiene una pestaña para la **Portada**, otra para **Apariencia y SEO** (color de acento, fuente y estilo: *Moderno*, *Minimalista*, *Rústico* o *Elegante*) y una por cada sección. Con **+ Añadir sección** eliges el tipo: *Texto*, *Destacados*, *Galería*, *Sobre mí* (con tu foto, que subes en el propio editor de la sección), *Testimonios* (solo opiniones reales, con permiso de quien las dio) o *Contacto*. En *Destacados* y *Galería* marcas los items con casillas (si aún no creaste tu catálogo, vuelve a esta pestaña después de crear tu catálogo). Cada sección puede mostrarse justo bajo la portada o debajo del catálogo. Cada sección se puede subir, bajar o eliminar, y nada se publica hasta pulsar **Guardar**.
3. **Catálogo:** crea tus categorías y tus servicios. Para cada uno puedes indicar precio, duración, modalidad, zona, qué incluye y opciones de precio (por ejemplo «Sesión suelta» y «Pack de 4»), que añades con el botón **+ Añadir opción**. Si el precio se acuerda con el cliente, marca **Precio a consultar**. Cada uno lleva su **foto**: pulsa **Subir foto** en su ficha (primero guarda el catálogo; el botón se activa cuando el item ya está guardado). El panel la reduce solo para que cargue rápido y se vea bien al compartir por WhatsApp.
4. **FAQ:** hasta 15 preguntas frecuentes.
5. **Respaldo:** descarga una copia de todo tu contenido y guárdala. Hazlo antes de cambios grandes.

Hasta que pulses **Guardar** en cada sección, el sitio muestra los datos de ejemplo.

## Paso 3. Cómo se reserva y cómo se compra

- **Servicios:** cada servicio tiene un solo botón. «Reservar Cita» lleva a tu agenda (Calendly, Cal.com, Google Calendar…) si la categoría está marcada *con reserva*; en el resto, «Consultar por WhatsApp» abre un mensaje ya escrito.
- **Productos:** tienen carrito; al terminar, se arma un mensaje de WhatsApp con tu selección. No hay pagos en línea: el cobro lo acuerdas tú con quien te escribe.

## Paso 4 (opcional). Dominio propio y visitas

- **Dirección sin dominio propio:** ver «Antes de empezar» arriba. El nombre del sitio (`catalogo-personal`) sale de `"name"` en `wrangler.jsonc`; cambiarlo crea un Worker nuevo y obliga a volver a crear `ADMIN_PASSWORD`, así que mejor déjalo.
- **Dominio propio:** en tu Worker, **Settings → Domains & Routes → Add → Custom domain**.
- **Visitas:** en Cloudflare, **Analytics & Logs → Web Analytics → Add a site**, copia el *token* y pégalo en **Admin → General → Token de Cloudflare Web Analytics**. No usa cookies.

## Cómo traer mejoras del template

Tu repositorio no se actualiza solo. El botón de Cloudflare no copia la carpeta `.github/`, así que el workflow de sincronización se instala a mano **una sola vez**:

1. Abre [`sincronizar-template.yml`](https://github.com/capagratuita/catalogo-personal/blob/main/.github/workflows/sincronizar-template.yml) en el repositorio original y pulsa el icono **Copy raw file**.
2. En tu repositorio: **Add file → Create new file**. En el nombre escribe exactamente `.github/workflows/sincronizar-template.yml` (GitHub crea las carpetas al escribir las `/`) y pega el contenido.
3. Pulsa **Commit changes** sobre `main`.
4. Una sola vez, para que el workflow pueda abrir el pull request: **Settings → Actions → General → Workflow permissions** y marca **Allow GitHub Actions to create and approve pull requests**. Guarda.

Cuando quieras las mejoras nuevas:

1. En tu repositorio entra en **Actions → Sincronizar con el template → Run workflow**. (Si GitHub pide habilitar los workflows, acéptalo.)
2. Espera un minuto: se abre un **pull request** «Sincronizar con el template» con los cambios. Si no se crea solo (falta el ajuste del paso 4 de arriba), la ejecución deja en su resumen un enlace para abrirlo a mano.
3. Revisa los cambios y pulsa **Merge**. Cloudflare vuelve a desplegar solo.

No se toca tu `wrangler.jsonc` (ahí está tu configuración de KV) ni `.github/`, así que si el workflow cambia en el template tendrás que volver a copiarlo. Si el pull request avisa de que `wrangler.jsonc` cambió, aplica los cambios a mano conservando tus `id`. Tu contenido (catálogo, fotos, textos) está en KV, no en el repositorio, así que no se pierde.

## Problemas frecuentes

| Qué ves | Qué hacer |
|---|---|
| El panel dice «ADMIN_PASSWORD no configurada» | Falta crear el secreto `ADMIN_PASSWORD` (paso 1), o volver a desplegar después de crearlo. |
| «Contraseña incorrecta» y luego «Demasiados intentos» | Espera 15 minutos. Tras 5 fallos seguidos el acceso se bloquea temporalmente. |
| Subo una foto y no cambia | Los cambios pueden tardar hasta 1 minuto en verse. Recarga con Ctrl+F5. |
| Guardo y sale un error en rojo | Léelo: indica qué campo corregir (por ejemplo, un enlace que debe empezar por `https://`). |
| Al guardar la Landing sale un error sobre items | Una sección «Destacados» o «Galería» usa un item que ya no existe en el catálogo. En esa sección aparece marcado en rojo: desmárcalo. |
| El sitio muestra datos de otra persona | No guardaste esa sección todavía. Entra al panel y pulsa **Guardar**. |

## Límites de la capa gratuita (referencia)

Cada visita consume pocas operaciones (la página y una por foto), y el sitio usa caché para ahorrar lecturas. Para un catálogo personal sobra. Si algún día lo superas, Cloudflare te lo indica en el dashboard.
