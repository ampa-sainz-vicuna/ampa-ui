# AMPA UI — contexto para Claude

La librería común del frontal de la suite del AMPA (`@ampa/ui`): tema, logo,
cabecera, entrada con Google, diálogo de confirmación y cliente de la API. La
usan las aplicaciones hermanas, cada una en su repositorio:
[`ampa-fichajes`](../ampa-fichajes/CLAUDE.md),
[`ampa-listados`](../ampa-listados/CLAUDE.md) y
[`ampa-facturacion`](../ampa-facturacion/CLAUDE.md).

El detalle de cada decisión (qué hay dentro, qué no y por qué, cómo se
distribuye, cómo se publica una versión) está en [README.md](README.md). Este
fichero es el resumen para arrancar.

Repositorio **público** (el porqué, en el README):
`https://github.com/ampa-sainz-vicuna/ampa-ui`. Después de cada commit, `git push`.

El back común ya existe: es el [portal](../ampa-portal/CLAUDE.md), en
producción desde el 24/09/2026 (diseño en la
[hoja de ruta, sección 4a](../ampa-fichajes/docs/hoja-de-ruta.md)). Lo
siguiente aquí, en *Estado*, punto 8.

---

## Cómo trabajar con el usuario

El mismo que en el resto de la suite; las reglas, con su motivo, en el
[`CLAUDE.md` de fichajes](../ampa-fichajes/CLAUDE.md). En resumen: en español;
por defecto dictar ficheros enteros marcados NUEVO o REEMPLAZAR; si dice "hazlo
tú", escribirlos, pasar los tests y terminar con el listado de ficheros; no
hacer commit salvo que lo pida; verificar antes de afirmar; explicar el porqué;
Material Design (MUI) con los colores del AMPA y estilos con `sx`, sin Tailwind.

**Aquí, además:** esta librería la usan todas las aplicaciones. Un cambio que
obliga a tocarlas (renombrar una prop, cambiar una ruta del contrato) sube la
segunda cifra de la versión y se dice en el mensaje de la release qué hay que
cambiar en cada una.

---

## Stack (el mismo que las aplicaciones, verificado el 24/09/2026)

React 19.3, TypeScript 6.0.3, MUI 9.4, Vitest 5.0 + Testing Library, oxlint.
Sin Vite: se compila con `tsc` a `dist/` (JavaScript + `.d.ts`). Node 22 en
Docker (`node:22-alpine`); **no hay Node en Windows**.

```bash
docker compose run --rm node npm ci
docker compose run --rm node npm test
docker compose run --rm node npm run lint
docker compose run --rm node npm run typecheck
docker compose run --rm node npm pack      # construye y deja ampa-ui-X.Y.Z.tgz
```

## Cómo se distribuye, en una frase

Al subir una etiqueta `vX.Y.Z`, una GitHub Action pasa los tests, construye el
paquete y lo cuelga en la release; cada aplicación lo instala por la URL de esa
release, con el hash en su lockfile. Sin credenciales ni `git` en ningún sitio.

---

## Reglas del código

- **Los imports entre ficheros llevan extensión** (`./theme.ts`,
  `./AppShell.tsx`), y `rewriteRelativeImportExtensions` la cambia a `.js` al
  compilar. Sin extensión, el JavaScript generado solo lo entiende un
  empaquetador; con ella lo entiende también Node, que es quien carga la
  librería cuando Vitest corre los tests de una aplicación.
- **Nada que no sea JavaScript dentro del paquete**: ni `.png`, ni `.css`. Node
  no sabe cargarlos y el primer test de la aplicación que tocara ese componente
  fallaría. Por eso el logo va como `data:` URI (`src/brand/logo.ts`, generado
  por `scripts/logo.mjs`) y las fuentes las importa cada aplicación.
- **Nada de `import.meta.env`**: la librería no lee variables de entorno. Lo que
  cambia de una aplicación a otra le llega por `SuiteApp`.
- **Lo que se exporta está en `src/index.ts`**; lo demás es interno.
- Getters y demás reglas de PHP no aplican aquí; sí el estilo de las
  aplicaciones: comentarios que explican el porqué, en español.

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

---

## Trampas conocidas

- **`npm install github:…#etiqueta` no funciona en `node:22-alpine`**: no trae
  `git`. Por eso se instala por la URL de la release.
- **GitHub Packages pide token incluso para instalar paquetes públicos.**
  Descartado por eso.
- **El repositorio tiene que ser público.** Privado, la URL de la release da
  404 a quien no lleva credenciales (Docker, Cloud Build), aunque desde el
  navegador de quien lo creó se vea perfectamente.
- **`docker compose exec node …` para instalar en una aplicación se lanza desde
  la carpeta de esa aplicación**, no desde esta: aquí `node` no se queda
  levantado y el `exec` falla.
- **Después de cambiar el paquete en una aplicación, `docker compose restart
  node`**: Vite prepara las dependencias al arrancar y no se entera solo.
- **Un `file:` en el `package.json` de una aplicación rompe su despliegue**:
  Cloud Build solo recibe la carpeta de la aplicación, no esta.
- Las heredadas del resto de la suite (Docker sobre Windows, MUI 9) están en el
  [`CLAUDE.md` de fichajes](../ampa-fichajes/CLAUDE.md).
