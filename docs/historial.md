# Historial — lo que salió del CLAUDE.md el 03/10/2026 (lo más reciente arriba en lo que se añada a partir de ahora)

Copiado literal del `CLAUDE.md` antes de adelgazarlo; lo que sigue vigente está
resumido allí.

---

## 08/10/2026: aprobada la tabla común con exportación a Excel (pendiente)

- Publicada la 0.2.10; tabla de versiones puesta al día (todas la 0.2.10
  salvo documentos, en la 0.2.9).
- **Aprobado por el usuario**, para una sesión aparte: un componente de tabla
  en `@ampa/ui` con orden, filtros, búsqueda sin tildes y botón de exportar a
  `.xlsx`.
- **Por qué**: tareas (histórico), Proveedores y facturación repiten tablas y
  filtros, y casi ninguna exporta.
- Solo añade, así que sube la tercera cifra.
- **A decidir al empezar**: la librería de Excel (verificar licencia y
  tamaño; SheetJS frente a exceljs u otra) y si la exportación se hace en el
  navegador.

---

## 0.2.9, publicada (04/10/2026)

Commit `1ba5fa9`, etiqueta `v0.2.9`, release construida por la Action. Solo
añade, por eso sube la tercera cifra.

- **`AppShell` acepta `home?: { href, label }`**: a dónde lleva el logo. Por
  defecto, al portal, como siempre.
- **Por qué**: las pantallas públicas de Documentos (firmar con enlace y
  comprobar un PDF, `?firma` y `?verificar`) son para gente de fuera de la
  suite, que no puede entrar en el portal. Allí el logo lleva a
  `https://ampasainzvicuna.com`.
- Tests: 79, lint, tipos y build en verde.
- Quién la usa: documentos 0.2.9; tareas, proveedores y facturación 0.2.8;
  fichajes y listados 0.2.5; portal 0.2.7.

---

## 0.2.8, preparada, sin publicar (03/10/2026)

**Sin commit ni etiqueta.** `package.json` ya está en 0.2.8; solo añade, así
que sube la tercera cifra. Sale de la fase 2 de
[`ampa-documentos`](../ampa-documentos/CLAUDE.md) (adjuntar desde Documentos).

- **`DocumentPicker`** (`src/documents/`): selector con espacios, carpetas y
  búsqueda; devuelve un `PickedDocument`. Props: `open`, `title`,
  `confirmLabel`, `requireContent`, `busy`, `error`, `onPick`, `onClose`. A quien
  no entra en Documentos le enseña un aviso.
- **`documentsUrlOf(applications)`**, el tipo `PickedDocument` y el export de
  `useSessionUser`.
- **Solo lee** de Documentos (`credentials: 'include'`, CORS de Documentos); no
  escribe nada allí: el uso lo apunta el servidor de cada aplicación, con la
  cookie de quien pide (el cliente del portal rechaza los POST del navegador
  desde otro subdominio).
- README: apartado «Adjuntar desde Documentos».
- Tests: 78, lint y tipos en verde. En `src/auth/SessionGate.test.tsx`, un
  correo del dominio del AMPA cambiado por uno `@ampa.test` (el repo es
  público).
- **Falta**: publicarla (permiso del usuario: commit, etiqueta, push) y que
  tareas la instale desde la release (de 0.2.5 a 0.2.8; la 0.2.6 y la 0.2.7
  solo añadían iconos). Tareas apunta ahora a `file:../ampa-ui/ampa-ui-0.2.8.tgz`
  para probar en local.
- Salió del `CLAUDE.md` (resumen de versiones anteriores, copiado literal):
  «Antes: 0.2.6 (el icono de Proveedores), 0.2.5 (la ayuda con buscador en la
  barra, sin IA, contra `GET {portalUrl}/api/ayuda` con `credentials: 'include'`;
  contrato en el README), 0.2.4 (lavado de cara), 0.2.3 (botón de Google en
  modo redirección) y 0.2.2 (logo al portal y `ApplicationSwitcher`).»

---

## 0.2.7, publicada el 03/10/2026

- El icono de Documentos, `FolderCopyRounded`, en `ApplicationIcon`, y
  «Documentos» en los nombres de la Ayuda (`HelpPanel`). Como la 0.2.6, solo
  añade: las aplicaciones no cambian nada (con una versión anterior, icono
  genérico).
- Hecha por Claude desde la sesión que empezó
  [`ampa-documentos`](../ampa-documentos/CLAUDE.md). Commit `97300bd`
  «Versión 0.2.7: el icono y el nombre de Documentos», etiqueta `v0.2.7`; la
  Action «Publicar versión» acabó bien y colgó `ampa-ui-0.2.7.tgz`.
- 72 tests, lint y tipos en verde.
- Ya la usan el portal (`cb2149f`) y documentos (`a7e16fc`); las demás, cuando
  se toquen.

---

## Estado

**Hecho (24/09/2026, a petición del usuario, "hazlo tú")**

- Versión **0.1.0**: `SuiteRoot`, `SessionGate`, `AppShell`, `ConfirmDialog`,
  `apiRequest`/`apiDownload`/`ApiError`/`messageOf`, `saveFile`, tema y logo.
  **40 tests en verde**, lint y tipos limpios.
- Sale de juntar las tres copias. Donde no coincidían se decidió así:
  - **Cliente de la API**: el de listados (el error guarda el cuerpo, la
    descarga devuelve el nombre del fichero) más `messageOf` y el mensaje del
    404 de facturación. Sin `VITE_API_URL`: siempre valía vacío.
  - **413**: "El fichero es demasiado grande." a secas. Fichajes decía "el
    máximo son 20 MB", pero ese límite es suyo.
  - **`ConfirmDialog`**: el texto como `children` (fichajes), `busy`
    (fichajes), `onCancel` (listados y facturación) y el título enlazado al
    diálogo con `aria-labelledby` (facturación). El botón de confirmar, del
    color primario: el rojo `error` de facturación y el rojo del AMPA casi no
    se distinguen.
  - **`AppShell`**: el botón de salir solo sale si se pasa `onSignOut`, para
    que facturación, que entonces no tenía login, pudiera usarlo ya (entra
    por el portal desde el 25/09/2026). `maxWidth`
    porque fichajes es de móvil (`sm`) y facturación de tablas (`md`).
  - **`scrollbar-gutter: stable`**, que facturación tenía en su `index.css`,
    pasa al tema: el salto lateral al abrir un desplegable pasa en todas.
  - **Logo reducido** a 480 px de ancho (19 KB en vez de 38): nunca se pinta a
    más de 240 px. El original sigue en `assets/logo-ampa.png`.
- **Publicada la 0.1.0** el 24/09/2026: la Action pasó en verde y la release
  lleva `ampa-ui-0.1.0.tgz` (60 KB). El repositorio se creó privado sin querer
  y la descarga daba 404 hasta hacerlo público.
- **Adoptada en listados**, instalada desde la release. Comprobado también que
  la imagen de producción de listados la instala sin esta carpeta al lado.
- **0.1.1** (24/09/2026, al adoptarla en fichajes): dos arreglos que salieron
  al comparar con la copia de fichajes. `apiDownload` se quedaba con el
  `filename` en ASCII que Symfony pone para navegadores antiguos
  ("N_mina.pdf") en vez de `filename*` ("Nómina.pdf"); y `saveFile` liberaba
  el blob en el acto, y algunos navegadores cortan así la descarga (fichajes
  esperaba 60 s). Listados sigue en la 0.1.0: sus nombres son ASCII y no le
  afecta lo primero, pero conviene subirla.

**Pendiente, en este orden**

1. ~~Publicar la 0.1.0~~ Hecho.
2. ~~Adoptarla en fichajes~~ Hecho el 24/09/2026, ya con la **0.1.1**
   (detalle en su `CLAUDE.md`, *Front común de la suite*). `ConfirmDialog` con
   `onCancel`, descargas con `{ blob, filename }` y el nombre del servidor,
   `SessionGate<SessionUser>` con sus dos roles, y la configuración en
   `src/suiteApp.ts` (fuera de `main.tsx` para que el test de `App` la use).
   134 tests, lint y build en verde; visto en el navegador y construida la
   etapa de React de su `Dockerfile` sin esta carpeta al lado.
3. ~~Adoptarla en facturación~~ Hecho el 24/09/2026, con la **0.1.1**:
   `SuiteRoot`, `AppShell` con `maxWidth="md"` y sin `onSignOut`,
   `ConfirmDialog` con `children`, `messageOf`/`apiRequest` y las fuentes.
   `index.css` y el comentario de `.importe` fuera (ya se hace con `sx` en
   `Figures.tsx`, decidido con el usuario). `googleClientId: ''` hasta que
   tenga login; entonces, `SessionGate`. 39 tests, lint y build en verde.
4. ~~Subir listados a la 0.1.1~~ Hecho el 24/09/2026 (29 tests, lint y build
   en verde). **Las tres aplicaciones están en la 0.1.1.**
5. **Siguiente: el back común**, que no es de este repositorio. **Diseño
   decidido el 24/09/2026**, entero en la
   [hoja de ruta de la suite, sección 4a](../ampa-fichajes/docs/hoja-de-ruta.md):
   el back común es **el portal** (`ampa-portal`, servicio aparte y único dueño
   de los permisos), con **un token para toda la suite en una cookie** de
   `.ampasainzvicuna.com`. Lo que toca a esta librería, **0.2.0** (cambia el
   contrato, hay que tocar las tres aplicaciones): `SessionGate` ya no pinta el
   botón de Google sino que manda al portal con `?volver=…` si `/api/me` da
   401; el cliente deja de mandar `Authorization: Bearer`; salir es una llamada
   que borra la cookie. La pantalla de permisos va en el front del portal
   (hecho con esta librería), no dentro de ella. Orden: primero el portal,
   luego esta 0.2.0.
6. **0.2.0 publicada el 24/09/2026** (release con el `.tgz`; el portal la
   usa desde ahí). Las aplicaciones siguen en la 0.1.1 hasta adoptar el
   portal. Lo que se hizo: `SuiteApp` con
   `portalUrl` y, solo en el portal, `google`; `storageKey`, `googleClientId`,
   `hostedDomain` y `tokenStorage` fuera; `Session` y `apiRequest` sin `token`;
   `SessionGate` según `/api/me` (200 / 401 → portal o botón de Google / 403
   "no tienes acceso" / error), `useSession` sin setState en el efecto. **36
   tests, lint y tipos en verde**. Migración de cada aplicación: README,
   *Pasar de la 0.1 a la 0.2*. **Adoptarla en una aplicación solo junto con
   el cliente del portal en su servidor**: una sin la otra no deja entrar a
   nadie. El portal ya está desplegado (ver su `CLAUDE.md`).
7. **Las tres aplicaciones están en la 0.2.0 y desplegadas** (25/09/2026), y
   tareas (sin desplegar) también la usa. El usuario comprobó ese día que la
   sesión viaja entre aplicaciones.
8. **0.2.1: menos plano** (25/09/2026, **hecho por Claude**, pedido por el
   usuario: «que todo no se vea tan plano en todas las apps», botones más
   grandes, algo más de color). Solo añade: ninguna aplicación tiene que
   cambiar su código para recibirlo.
   - Tema: tarjetas con sombra suave teñida de azul en vez de borde (una
     tarjeta `variant="outlined"` sigue saliendo con borde, útil dentro de un
     diálogo), fondo `#F1F2F7`, botones de pastilla con la altura de Material 3
     (40 px; 48 los `large`), los rellenos con sombra de su color y los de
     borde con un fondo tenue, `Fab` con sombra de su color, diálogos con
     esquinas de 20 px (0 a pantalla completa).
   - `AppShell`: una franja de 3 px con el rojo del AMPA arriba de la barra.
   - **`CardTitle`**, nuevo: la cabecera de tarjeta con el icono en un
     círculo de color. Salió de fichajes, que es la primera que lo usa en
     todas sus tarjetas.
   - **Adoptada en fichajes**, y el 26/09/2026 (hecho por Claude, "hazlo
     tú") **en listados, facturación, portal y tareas**: la 0.2.1 instalada y
     sus tarjetas con `CardTitle` (ámbar lo que pide atención: alguien que ya
     no aparece en listados, recibos por cobrar y mes por cerrar en
     facturación). Los navegadores de mes y curso de facturación se quedan
     como estaban: son flechas, no títulos. En el portal, "Mis correos" y
     "Permisos" pasan a ir dentro de una tarjeta y las de las aplicaciones
     pierden el borde; en tareas, columnas teñidas sin borde y tarjetas con
     sombra. Tests, lint y build en verde en las cuatro (32, 56, 14 y 7
     tests). ~~Falta: verlas en el navegador, el commit de cada una (sin
     mezclar su `CLAUDE.md`, que tenía cambios sin subir) y desplegarlas~~ **Hecho**: las cinco, subidas y desplegadas (y el 26/09/2026 otra vez, con la 0.2.2).
9. **Siguiente: saltar entre aplicaciones desde la barra** (pedido por el
   usuario el 25/09/2026: hoy no hay forma de volver al portal ni de pasar a
   otra aplicación). `AppShell` pinta un botón con las aplicaciones de esa
   persona y "Portal" (la dirección ya la tiene: `SuiteApp.portalUrl`). La
   lista sale de `/api/me` (`applications`), que tiene que añadir antes el
   cliente del portal (ver el `CLAUDE.md` del portal, pendiente 5). Si
   `/api/me` no la trae, al menos el enlace al portal: así la versión nueva
   solo añade (0.2.2) y ninguna aplicación tiene que cambiar su código.
10. **0.2.2 hecha el 26/09/2026** (Claude, pedido por el usuario antes de
    irse: «que el enlace del header lleve al portal» y «el selector en el
    header entre aplicaciones»). Solo añade:
    - El **logo** de la barra es un enlace al portal (`portalUrl`).
    - **`ApplicationSwitcher`**: botón de cuadrícula en la barra con
      "Portal" y, debajo, las aplicaciones de esa persona; la abierta sale
      marcada, sin enlace (se reconoce por el origen de su `url`). Lo lee de
      `SessionGate`, que ahora deja lo que contestó `/api/me` en
      `SessionUserContext`: la aplicación no pasa nada. Sin `applications`
      en `/api/me` (cliente del portal anterior a la 0.1.4), no sale.
    - **`ApplicationIcon`** (exportado): el icono de cada aplicación por su
      código, el mismo que las tarjetas del portal. `SuiteLink` y
      `SessionUser.applications`, en los tipos.
    - Visto en el navegador en tareas (escritorio y móvil) contra el portal
      local. 40 tests.
11. **0.2.3: el botón de Google en modo redirección** (27/09/2026, Claude,
    "hazlo tú"). A alguien con Android la ventana emergente de Google se le
    quedaba en `about:blank` y no podía entrar (vídeo del usuario). Ahora la
    página entera va a Google y Google la devuelve con un POST a
    `/api/auth/google/vuelta` del portal (ruta nueva, `AuthController::
    signInReturn`), que pone la cookie y lleva a `/?entrada=ok|sin-acceso|
    no-valida|caducada` (con el `?volver=` que llevara, en el `state` de
    GIS). `AuthProvider` lo lee (`signInReturn.ts`): con `ok` arranca con
    `epoch` en 1 (el portal devuelve solo a la aplicación de origen, como
    antes), si no, el porqué en `notice`; y lo quita de la dirección.
    - Solo afecta al portal (el único con `google`): ninguna aplicación
      cambia nada. `signIn` se queda en `AuthState` (exportado) aunque el
      botón ya no lo use: quitarlo sería la segunda cifra.
    - **Requisito**: la ruta de vuelta en los *URI de redirección
      autorizados* del cliente OAuth, por cada origen (README del portal).
    - Sin callback en `initialize()`: con él, GIS no redirige (lo usa en su
      lugar). `state` no está en los tipos de `@types/google.accounts`.
    - 45 tests.
12. **0.2.4: lavado de cara** (28/09/2026, Claude, pedido por el usuario:
    «modernizar un poco la interfaz pero sin que pierda la esencia», para
    toda la suite, con commit y despliegue). Solo cambia el aspecto: ninguna
    aplicación cambia su código. Los mismos colores, Roboto y piezas; la
    franja roja de la barra se queda.
    - **Tema**: títulos en 700 con las letras algo más juntas (700 y no 600:
      las aplicaciones solo cargan 400, 500 y 700), texto casi negro con un
      punto de azul, bordes y divisores del azul muy rebajado, un halo muy
      suave rojo y azul arriba del fondo, tarjetas de 16 px, campos de texto
      blancos con un anillo rojo suave al escribir, pestañas con la raya de
      3 px redondeada, menús y desplegables redondeados con borde fino,
      globos de ayuda azul casi negro, avisos con un borde de su color, velo
      azul difuminado detrás de los diálogos (24 px de esquina) y los botones
      se hunden un pelo al pulsarlos.
    - **`AppShell`**: la barra, blanca translúcida con desenfoque; primero el
      nombre de la aplicación en negrita y debajo quién ha entrado (antes al
      revés), con una raya entre el logo y los nombres; la barra y las
      pestañas van en la misma columna que el contenido (`maxWidth`), no
      pegadas a los bordes. Algo más de aire arriba del contenido.
    - **`EntryCard`** (entrar, "te llevamos al portal", sin acceso): tarjeta
      de 28 px con una banda roja recta arriba, sobre un fondo con los dos
      colores muy difuminados.
    - `CardTitle` hereda el peso de los títulos del tema.
    - La Ayuda, que estaba sin commit como 0.2.4, pasó a ser la 0.2.5
      (acordado con la sesión de tareas): punto 13.
    - 45 tests.
13. **0.2.5: la ayuda con buscador en la barra** (28/09/2026, Claude, pedido
    por el usuario; **publicada el 29/09/2026**, junto con el lavado de
    cara de la 0.2.4, y subida en las cinco). Es la pieza (3) de
    la *Ayuda de la suite*: preguntas frecuentes con buscador, **sin IA**,
    que derivan lo que no está al cuaderno de NotebookLM
    ((el enlace, en `../ampa-manuales/CLAUDE.md`: este repositorio es público)).
    Pieza (1), el contenido: `ampa-manuales/ayuda/faq.json`. Pieza (2), que
    el portal sirva las preguntas: otro trabajo, en paralelo. **Orden
    después**: revisión del usuario → publicar la 0.2.5 → portal → subir la
    0.2.5 en las cinco.
    - Contrato que consume: `GET {portalUrl}/api/ayuda` con
      `credentials: 'include'` (la cookie es de `.ampasainzvicuna.com`; el
      portal contesta CORS con credenciales a los orígenes de la suite; en
      el portal es el mismo origen). 401 sin sesión. El servidor ya filtra lo
      que la persona puede ver.
      `{ notebookUrl: string|null, contactEmail: string|null, updatedAt:
      "2026-09-28"|null, entries: [{ id, application:
      "general|portal|fichajes|listados|facturacion|tareas", question,
      answer (párrafos, "1. ", "- ", **negrita**), keywords: string[],
      manual: "06"|null }] }`.
    - Qué hay: `src/help/helpContent.ts` (tipos, `loadHelp` con caché en
      memoria mientras dure la página, `parseHelp` que salta entradas mal
      escritas), `src/help/search.ts` (NFD sin tildes, palabras vacías,
      prefijos de 3 letras o más, pesos pregunta 10/7 > palabras clave 6/4 >
      respuesta 2/1 (entera/a medias), ×la parte de las palabras con las que
      encaja, entra con la mitad; +2 si es de la aplicación abierta),
      `src/help/HelpAnswer.tsx` (párrafos, listas y negrita como elementos de
      React, nunca HTML), `src/help/useHelp.ts` (carga perezosa al abrir el
      panel, sin setState en el efecto, como `useSession`),
      `src/help/HelpPanel.tsx` (el `Drawer`: buscador con foco, grupos,
      acordeones, «No está en la ayuda» → «Preguntar al asistente» y el
      correo, cuaderno al pie, cargando/error/vacío),
      `src/help/HelpButton.tsx`, y `src/shell/here.ts` (`isHere`, sacado de
      `ApplicationSwitcher`, y `currentApplication`: la aplicación abierta
      por el origen, `portal` en el portal). En `AppShell`, el botón solo
      con sesión (`SessionUserContext`), antes del selector.
    - **Las aplicaciones no cambian nada**: basta con subir de versión (no
      hay prop nueva; nada nuevo en `src/index.ts`).
    - 72 tests (27 nuevos), lint, tipos y `npm pack` en verde;
      `ampa-ui-0.2.5.tgz` en esta carpeta para probarla en local (README,
      *Probar un cambio…*). **Vista en el navegador el 29/09/2026** en el
      portal, con las 88 preguntas de verdad y una API simulada: buscar,
      abrir una respuesta, «No está en la ayuda» y la pestaña de administración.
    - Contrato y comportamiento, en el README, *La ayuda de la barra*.

14. **0.2.6: Proveedores (`crm`)** (29/09/2026, Claude, desde la sesión que
    empezó [`ampa-crm`](../ampa-crm/CLAUDE.md); publicada con permiso del
    usuario, "haz lo que falta"): su icono, `StorefrontRounded`, en
    `ApplicationIcon`, y «Proveedores» en los nombres de la Ayuda
    (`HelpPanel`). Solo añade: las aplicaciones no cambian nada; con una
    versión anterior, la tarjeta y el selector enseñan el icono genérico.
    72 tests y lint en verde. La suben el portal y proveedores; las demás,
    cuando se toquen.
