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
    que facturación, que aún no tiene login, pueda usarlo ya. `maxWidth`
    porque fichajes es de móvil (`sm`) y facturación de tablas (`md`).
  - **`scrollbar-gutter: stable`**, que facturación tenía en su `index.css`,
    pasa al tema: el salto lateral al abrir un desplegable pasa en todas.
  - **Logo reducido** a 480 px de ancho (19 KB en vez de 38): nunca se pinta a
    más de 240 px. El original sigue en `assets/logo-ampa.png`.
- **Adoptada en listados** (sin commit todavía; ver su `CLAUDE.md`).

**Pendiente, en este orden**

1. **Publicar la 0.1.0** (lo hace el usuario: crear el repositorio y subir la
   etiqueta). Comandos en el `CLAUDE.md` de listados, *Siguiente paso*.
2. **Adoptarla en fichajes.** Lo que cambia respecto a listados:
   - `ConfirmDialog`: `onClose` → `onCancel` (los usos están en `admin/`).
   - `apiDownload(path, token)` devolvía un `Blob`; ahora
     `apiDownload(path, { token })` devuelve `{ blob, filename }`.
   - `App.tsx` pasa a `SessionGate<SessionUser>` con su `SessionUser`
     (`isEmployee`, `isAdmin`) y el `Workspace` que ya tiene.
   - Su test del 413 esperaba "el máximo son 20 MB".
   - Ojo: fichajes tenía cambios sin commit el 24/09/2026. Mirar `git status`
     antes de empezar.
3. **Adoptarla en facturación**, que no tiene login todavía: `SuiteRoot`,
   `AppShell` sin `onSignOut` (con `maxWidth="md"`), `ConfirmDialog` (pasar de
   `message` a `children`), el cliente de la API y las fuentes, que no tenía.
   Su `index.css` sobra: lo único que tenía (`scrollbar-gutter`) ya está en el
   tema. Su `theme.ts` tiene además un comentario sobre cifras de ancho fijo y
   una clase `.importe` que no existe: preguntar si se quería hacer. Cuando
   llegue el login, `SessionGate` y listo.
4. Después, **el back común** (las dos rutas del contrato, `POST
   /api/auth/google` y `GET /api/me`, son la frontera entre los dos).

---

## Trampas conocidas

- **`npm install github:…#etiqueta` no funciona en `node:22-alpine`**: no trae
  `git`. Por eso se instala por la URL de la release.
- **GitHub Packages pide token incluso para instalar paquetes públicos.**
  Descartado por eso.
- **Después de cambiar el paquete en una aplicación, `docker compose restart
  node`**: Vite prepara las dependencias al arrancar y no se entera solo.
- **Un `file:` en el `package.json` de una aplicación rompe su despliegue**:
  Cloud Build solo recibe la carpeta de la aplicación, no esta.
- Las heredadas del resto de la suite (Docker sobre Windows, MUI 9) están en el
  [`CLAUDE.md` de fichajes](../ampa-fichajes/CLAUDE.md).
