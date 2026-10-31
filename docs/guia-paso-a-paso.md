# Guía paso a paso: publica y configura tu catálogo

Esta guía es para quien quiere publicar sus **servicios** (y, si quiere, algunos productos) sin programar. No necesitas terminal ni tarjeta de crédito: todo se hace con clics en GitHub y en Cloudflare, y cabe en la capa gratuita.

- **Publicar** (pasos «Antes de empezar» y 1): unos 10 minutos.
- **Configurar** (paso 2): el grueso de la guía. Una sección por cada pantalla del panel, en el orden en que conviene rellenarlas.

> Los nombres de los menús de Cloudflare cambian de vez en cuando. Si algo no coincide, busca la opción con un nombre parecido.

## Qué necesitas

- Una cuenta de [GitHub](https://github.com) (gratuita).
- Una cuenta de [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuita).
- Tu número de WhatsApp con código de país (por ejemplo `+51999999999`).
- Una contraseña larga para el panel de administración (mínimo 12 caracteres; el sitio te avisará si es más corta).
- Para configurar: los textos y fotos de tus servicios. Una foto por servicio basta; el panel la reduce solo.

## Antes de empezar: elige la dirección de tu sitio

Sin dominio propio, tu sitio queda en `https://<nombre-del-sitio>.<tu-subdominio>.workers.dev`. Cloudflare genera tu subdominio al azar al crear la cuenta (algo como `mute-haze-3d90`). **Cámbialo antes de desplegar** para tener una dirección con sentido, por ejemplo `https://catalogo-personal.tu-nombre.workers.dev`:

1. En el dashboard de Cloudflare entra en **Workers & Pages**. En la barra lateral derecha, la tarjeta **Account details** muestra tu *Account ID* y tu **Subdomain**. Pulsa el lápiz junto al subdominio.
2. Escribe el que quieras. Cloudflare comprueba al momento si está disponible: es único en todo Cloudflare, así que si está ocupado prueba otro. Vale para todos los Workers de tu cuenta.

Si lo cambias **después** de desplegar también funciona, pero la dirección anterior deja de servir y la nueva tarda un par de minutos en tener su certificado (hasta entonces el navegador puede avisar de conexión no segura). Quien visite el enlace viejo no llegará al sitio.

## Paso 1. Despliega con un clic

1. Pulsa el botón **Deploy to Cloudflare** del [README del proyecto](../README.md) (inicia sesión en Cloudflare y en GitHub si te lo pide).
2. Puedes cambiar libremente el **nombre del proyecto** en el formulario (por ejemplo `mi-portafolio`): será el nombre de tu repositorio en GitHub, de tu Worker y de la dirección (`https://mi-portafolio.tu-subdominio.workers.dev`). Después no lo cambies a mano en `wrangler.jsonc`: crearía un Worker nuevo.
3. Desplázate hasta el final del formulario: verás los nombres de los dos almacenes de datos (KV) y el campo `ADMIN_PASSWORD`. Por defecto los dos KV traen el mismo nombre y **eso falla**. Cámbialos a dos nombres distintos entre sí, por ejemplo `catalogo-datos` (para `KV`, textos y catálogo) y `catalogo-fotos` (para `IMAGES`, fotos).
4. Cuando te pida `ADMIN_PASSWORD`, escribe tu contraseña de administrador (mínimo 12 caracteres). Es un secreto: no se guarda en GitHub.
5. **Desactiva «Enable Preview builds».** Viene activado por defecto, pero este proyecto no usa vistas previas y su comando (`wrangler preview`) falla porque exige KV propios para previews. Si lo dejas activado, cada pull request de sincronización mostrará un build fallido ❌ que no afecta a tu sitio.
6. Pulsa **Implementar**. Al terminar verás una dirección del tipo `https://tu-proyecto.tu-usuario.workers.dev`.

> El sitio ya funciona y muestra datos de ejemplo. Si el formulario no te pidió la contraseña, añádela en tu Worker: **Settings → Variables and Secrets → Add**, tipo **Secret**, nombre exactamente `ADMIN_PASSWORD`, y vuelve a desplegar.

Nunca pegues la contraseña en GitHub ni en ningún archivo del proyecto.

## Paso 2. Configura tu sitio

Entra en `https://tu-proyecto.tu-usuario.workers.dev/admin` e inicia sesión. El menú del panel tiene cinco pantallas: **General**, **Mi página**, **Mi catálogo**, **FAQ** y **Respaldo**.

Dos reglas que valen para todo el panel:

- **Hasta que pulses Guardar en una pantalla, el sitio sigue mostrando los datos de ejemplo** de esa parte. Guarda cada pantalla cuando termines.
- Tras guardar, los cambios pueden tardar hasta 1 minuto en verse en el sitio público.

Orden recomendado: **General → Catálogo → Mi página → FAQ → Respaldo**. El catálogo va antes que la página porque algunas secciones de la página (destacados, galería) eligen items del catálogo.

### 2.0 Opcional: empieza desde un paquete de inicio

Si prefieres editar a partir de un sitio ya completo en vez de rellenar desde cero, importa uno de estos paquetes. Traen todas las secciones y todos los campos usados al máximo, con textos genéricos («Servicio 1», «Producto 1»…):

| Paquete | Para quién | Archivo |
|---|---|---|
| **Solo servicios** | Profesionales y emprendedores que ofrecen servicios | [`solo-servicios.json`](https://github.com/capagratuita/catalogo-personal/blob/main/config/paquetes/solo-servicios.json) |
| **Solo productos** | Quien vende productos, con carrito por WhatsApp | [`solo-productos.json`](https://github.com/capagratuita/catalogo-personal/blob/main/config/paquetes/solo-productos.json) |
| **Mixto** | Servicios y productos a la vez | [`mixto.json`](https://github.com/capagratuita/catalogo-personal/blob/main/config/paquetes/mixto.json) |

1. Abre el archivo en GitHub y pulsa **Download raw file** (el icono de descarga, arriba a la derecha del contenido).
2. En el panel entra en **Respaldo → Importar**, elige el archivo y pulsa **Importar respaldo**. Confirma el aviso: **reemplaza todo el contenido guardado** (General, Catálogo, Mi página y FAQ).
3. Recorre las pantallas del 2.1 al 2.4 y **cambia todo lo que sea de ejemplo**. Lo más importante:
   - el WhatsApp (`+51999999999`), el correo (`correo@ejemplo.com`), el enlace de reserva (`calendly.com/tu-usuario/…`), la dirección y las redes sociales son falsos: ponlos tuyos o vacíalos;
   - los **testimonios** son marcadores (empiezan con «[Ejemplo n]»): reemplázalos por opiniones reales con permiso o elimina la sección;
   - borra los servicios, productos, categorías y preguntas que no uses.
4. Sube las fotos: **los paquetes no incluyen fotos**. Los items muestran una imagen gris hasta que subas la tuya (2.2), y las galerías de los servicios que la traen y la foto de «Sobre mí» también se ven como marcadores (en «Sobre mí», con las iniciales de tu nombre).

El paquete elegido ya trae su *Tipo de catálogo* (solo servicios, solo productos o mixto). Si cambias de idea, ajústalo en General.

### 2.1 General

Datos de tu negocio. Se muestran en el encabezado, el pie y los botones de contacto.

| Campo | Qué poner |
|---|---|
| **Nombre del catálogo** | Tu nombre o el de tu negocio. Sale en el logo, el pie y el título de las pestañas. |
| **Descripción corta** | Una frase de lo que haces. Se usa al compartir el enlace. |
| **Tipo de catálogo** | *Solo servicios*, *solo productos* o *mixto*. Con *solo servicios* el sitio no muestra carrito. |
| **Moneda** | Código de tres letras (`PEN`, `MXN`, `COP`, `USD`…). Afecta a cómo se ven los precios. |
| **URL del logo** | Opcional. Si lo dejas vacío se muestra el nombre. |
| **WhatsApp: número** | Con código de país, por ejemplo `+51999999999`. Hace falta este o el usuario. |
| **WhatsApp: usuario** | Opcional. Si rellenas ambos, gana el usuario. |
| **Email** | Opcional. Solo se muestra en la sección Contacto. |
| **Enlace de reserva** | Opcional. La dirección de tu agenda (Calendly, Cal.com, Google Calendar…). Es el enlace general; cada servicio puede tener el suyo. |
| **Dirección** | Opcional. Si la rellenas, la ciudad es obligatoria. Aparece en el pie y ayuda a que te encuentren en buscadores. Déjala vacía si trabajas solo en línea. |
| **Instagram, Facebook, TikTok, YouTube** | Opcional. Enlaces completos que empiecen por `https://`. |
| **Token de Cloudflare Web Analytics** | Opcional. Ver «Visitas» en el paso 4. |

El ejemplo trae un WhatsApp falso (`+00000000000`): **cámbialo**, o los botones no te llegarán. Pulsa **Guardar configuración**.

### 2.2 Mi catálogo

Aquí viven tus servicios y, si quieres, tus productos.

1. **Elige la pestaña** *Servicios* o *Productos*. Cada una muestra su contador y filtra a la vez las categorías y los items; lo que crees nace del tipo de la pestaña activa.
2. **Crea las categorías.** Son agrupaciones para ordenar el catálogo (por ejemplo «Consultas», «Talleres», «Paquetes»). Las categorías de servicios y de productos son listas separadas.
3. **Marca qué categorías llevan reserva.** En el apartado **Servicios con reserva** marca las categorías de servicios que usan tu enlace de reserva. Los servicios de las demás categorías llevan el botón «Consultar por WhatsApp».
4. **Crea cada servicio** con el botón **+ Agregar servicio** (en la pestaña Productos es **+ Agregar producto**) y rellena su ficha:

| Campo | Qué poner |
|---|---|
| **Nombre y descripción** | La descripción larga va en la ficha del servicio; en la tarjeta de la portada se corta a dos líneas. |
| **ID (automático)** | Se genera solo. Forma parte de la dirección del servicio (`/servicio/…`); no hace falta tocarlo. |
| **Categoría** | Una de las que creaste. |
| **Precio y duración** | Precio en la moneda elegida y **Duración** en minutos. |
| **Disponible / Destacado** | *Destacado* lo sube al principio del catálogo de la portada. Si desmarcas *Disponible*, la ficha sigue existiendo pero se marca como no disponible para buscadores y deja de anunciarse en el mapa del sitio. |
| **Precio a consultar** | Márcalo si el precio se acuerda con cada cliente. Muestra «Desde X» (si pusiste precio) o «Precio a consultar» y el botón pasa a «Consultar por WhatsApp». |
| **Enlace de reserva propio** | Solo aparece en servicios de categorías con reserva. Si lo dejas vacío usa el enlace general de General. |

5. **Detalles del servicio.** Abre este bloque para completar:
   - **Modalidad** (*Online*, *Presencial*, *Online o presencial* o *Sin indicar*) y **Zona de atención**.
   - **Qué incluye**: una línea por punto, hasta 8.
   - **Opciones de precio** (hasta 6), con **+ Añadir opción**: por ejemplo «Sesión suelta» y «Pack de 4 sesiones», cada una con su precio. Si hay opciones, el servicio muestra «Desde» el precio más bajo.
   - **Galería de fotos**: hasta 6 fotos extra con **+ Añadir foto**, con descripción y flechas para ordenarlas. Se activa cuando el servicio ya está guardado.
6. **Pulsa Guardar Catálogo.** Un servicio nuevo tiene que estar guardado antes de poder subirle foto.
7. **Sube la foto** de cada servicio con **Subir foto** en su ficha. El panel la reduce solo (hasta 1200 px, unos 250 KB) para que cargue rápido y se vea al compartir por WhatsApp. Una foto nueva puede tardar hasta un minuto en verse.
8. **Ordena** los items con **↑ Subir** y **↓ Bajar**. El orden que ves es el que se publica.

Si usas productos: se crean igual pero sin los detalles de servicio (modalidad, opciones, galería). Los productos tienen carrito.

### 2.3 Mi página

Es la portada. Tiene tres pestañas: **Portada**, **Apariencia y SEO** y **Secciones**.

**Portada** (lo primero que ve la gente):

- **Título y subtítulo**: qué ofreces y para quién, en una frase.
- **Texto del botón** y **Adónde lleva el botón**: un solo botón. El ejemplo lleva a la sección de servicios; si el destino no existe, el botón se oculta.
- **URL de imagen de fondo** (opcional): una URL de imagen. Con imagen de fondo el texto de la portada pasa a blanco.

**Apariencia y SEO:**

- **Color de acento**: el color de los botones principales. El panel te avisa si el contraste con el texto es insuficiente.
- **Fuente y Estilo**: *Moderno*, *Minimalista*, *Rústico* o *Elegante*. Cambian bordes, sombras y espaciado, nunca los colores.
- **Título y descripción** de la portada para buscadores y para cuando compartan el enlace.

**Secciones:** con **+ Añadir sección** eliges el tipo.

| Tipo | Para qué sirve |
|---|---|
| **Mensaje** | Un título y uno o más párrafos (hasta 2000 caracteres). Puedes añadir varios. |
| **Destacados** | Elige con casillas qué items del catálogo mostrar. Puedes añadir varios. |
| **Galería** | Igual, como mosaico de fotos. Puedes añadir varias. |
| **Sobre mí** (solo una) | Tu presentación. Sube tu foto desde el propio editor (se guarda al momento). Si no hay foto, se muestran las iniciales de «Tu nombre». |
| **Testimonios** (solo una) | Hasta 8 opiniones con autor y detalle. **Solo opiniones reales y con permiso** de quien las dio. |
| **Contacto** (solo una) | Botones de WhatsApp y correo con los datos de General. |

*Sobre mí*, *Testimonios* y *Contacto* **solo pueden existir una vez**: si ya las tienes, en el selector aparecen atenuadas con «Ya la tienes» y no se pueden añadir de nuevo.

Cada sección elige **dónde se muestra**: justo bajo la portada o debajo del catálogo. Puedes subirlas, bajarlas o eliminarlas. Al quitar un item del catálogo que usa una sección, aparece marcado en rojo: desmárcalo antes de guardar. Pulsa **Guardar**.

### 2.4 FAQ

Hasta 15 preguntas frecuentes, con **+ Añadir pregunta**; cada una lleva pregunta y respuesta, y puedes subirlas o bajarlas. Sirven para resolver dudas antes de que te escriban y para aparecer mejor en buscadores. Pulsa **Guardar FAQ**.

### 2.5 Respaldo

Con **Descargar respaldo** obtienes una copia de todo tu contenido (General, Catálogo, Mi página y FAQ) en un solo archivo. **Hazlo ahora y antes de cada cambio grande.** Las fotos no van incluidas: se vuelven a subir desde cada item. Con **Importar respaldo** la restauras o pasas tu contenido a otra instalación (reemplaza lo guardado). Es el mismo mecanismo que usan los paquetes de inicio del 2.0.

### 2.6 Revisa tu sitio

Abre la dirección pública, mejor desde el celular, y comprueba:

- Que el nombre, la descripción y el WhatsApp son los tuyos.
- Que los botones de cada servicio hacen lo esperado (reservar o abrir WhatsApp con el mensaje).
- Que las fotos se ven y la portada no muestra textos de ejemplo.
- Que al compartir el enlace por WhatsApp aparece el título y, si hay foto, la imagen.

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
| El pull request de sincronización muestra «Build: Failed ❌» y el log dice «missing a `previews` block» | Es el build de vista previa de la rama, no el de producción: puedes fusionar sin problema. Para que no vuelva a salir, desactiva los builds de ramas no productivas en tu Worker (**Settings → Builds**, opción de builds para ramas que no son la de producción). |
| El despliegue falla con «title already exists» | Los dos KV del formulario tenían el mismo nombre. Borra los KV sobrantes en **Storage & Databases → KV** y repite el botón con dos nombres distintos. |
| El panel dice «ADMIN_PASSWORD no configurada» | Falta crear el secreto `ADMIN_PASSWORD` (paso 1), o volver a desplegar después de crearlo. |
| «Contraseña incorrecta» y luego «Demasiados intentos» | Espera 15 minutos. Tras 5 fallos seguidos el acceso se bloquea temporalmente. |
| Subo una foto y no cambia | Los cambios pueden tardar hasta 1 minuto en verse. Recarga con Ctrl+F5. |
| «Subir foto» está desactivado | El servicio aún no está guardado. Pulsa **Guardar Catálogo** y vuelve a intentarlo. |
| Guardo y sale un error en rojo | Léelo: indica qué campo corregir (por ejemplo, un enlace que debe empezar por `https://`). |
| Al guardar Mi página sale un error sobre items | Una sección «Destacados» o «Galería» usa un item que ya no existe en el catálogo. En esa sección aparece marcado en rojo: desmárcalo. |
| El sitio muestra datos de ejemplo | No guardaste esa pantalla todavía. Entra al panel y pulsa **Guardar**. |
| Cambié el subdominio y el sitio da aviso de seguridad | El certificado nuevo tarda un par de minutos. Espera y recarga. |

## Límites de la capa gratuita (referencia)

Cada visita consume pocas operaciones (la página y una por foto), y el sitio usa caché para ahorrar lecturas. Para un catálogo personal sobra. Si algún día lo superas, Cloudflare te lo indica en el dashboard.
