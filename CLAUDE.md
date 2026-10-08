# AMPA UI — contexto para Claude

La librería común del frontal de la suite del AMPA (`@ampa/ui`): tema, logo,
cabecera, entrada con Google, diálogo de confirmación, ayuda con buscador,
selector de documentos y cliente de la API. La usan todas las aplicaciones, cada una en su repositorio
(tabla de repos en el `CLAUDE.md` global).

El detalle de cada decisión (qué hay dentro, qué no y por qué, cómo se
distribuye, cómo se publica una versión, la ayuda de la barra, cómo pasar de
la 0.1 a la 0.2) está en [README.md](README.md). Lo hecho, versión a versión,
en [docs/historial.md](docs/historial.md). Este fichero es el resumen para
arrancar. El back común es el [portal](../ampa-portal/CLAUDE.md) (diseño en la
[hoja de ruta, sección 4a](../ampa-fichajes/docs/hoja-de-ruta.md)).

Repositorio **público** (el porqué, en el README):
`https://github.com/ampa-sainz-vicuna/ampa-ui`. Nada de correos reales en
código, tests ni `.md`. Después de cada commit, `git push`.

## Cómo trabajar

Las reglas comunes, en el `CLAUDE.md` global. **Aquí, además:** esta librería
la usan todas las aplicaciones. Un cambio que obliga a tocarlas (renombrar una
prop, cambiar una ruta del contrato) sube la **segunda cifra** de la versión y
el mensaje de la release dice qué cambiar en cada una; si solo añade, la
tercera. Getters y demás reglas de PHP no aplican aquí; sí el estilo de las
aplicaciones: comentarios que explican el porqué, en español.

## Stack (verificado el 24/09/2026)

React 19.3, TypeScript 6.0.3, MUI 9.4, Vitest 5.0 + Testing Library, oxlint.
**write-excel-file 4.1.1** (MIT; primera dependencia de verdad, no peer; se
carga con `import()` al exportar, variante `/universal`). Sin Vite: se compila con `tsc` a `dist/` (JavaScript + `.d.ts`). Node 22 en
Docker (`node:22-alpine`); **no hay Node en Windows**. Sin puertos: no se
levanta.

```bash
docker compose run --rm node npm ci
docker compose run --rm node npm test
docker compose run --rm node npm run lint
docker compose run --rm node npm run typecheck
docker compose run --rm node npm pack      # construye y deja ampa-ui-X.Y.Z.tgz
```

**Cómo se distribuye, en una frase:** al subir una etiqueta `vX.Y.Z`, una
GitHub Action pasa los tests, construye el paquete y lo cuelga en la release;
cada aplicación lo instala por la URL de esa release, con el hash en su
lockfile. Sin credenciales ni `git` en ningún sitio.

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
- **Ancho**: el valor por defecto de `AppShell` sigue siendo `sm`; cambiarlo a
  `md` obliga a publicar versión y subirla en todas, así que de momento cada
  aplicación pasa `maxWidth="md"` explícito (tareas, `lg`). Regla de la suite
  en el global.

## Estado

Publicada la **0.2.11** (08/10/2026; commit `dc400ee`, etiqueta `v0.2.11`,
release con su `.tgz`; solo añade): **`DataTable`** (`src/table/`), tabla común
con búsqueda sin tildes, orden, un filtro por columna `filterable`, «N de M»,
ranura `toolbar`, `hideBelow`, primera columna fija en móvil, `onRowClick` y
**«Exportar a Excel»** (`exportXlsx`). Columnas: text, number, money
(céntimos), date. También exporta `formatCell` y `normalizeForSearch`. 109
tests, lint, tipos, build y audit en verde. README: «La tabla común». Antes:
`DocumentPicker` abre en una carpeta (0.2.10), `AppShell home` (0.2.9),
`DocumentPicker` y `documentsUrlOf` (0.2.8; **solo lee** de Documentos).
**Quién usa qué** (08/10/2026): ninguna aplicación ha subido aún a la 0.2.11;
todas siguen en la 0.2.10 salvo documentos, en la 0.2.9.
Las versiones anteriores, en el historial.

**Pendiente**:
- **Adoptar `DataTable`** (de Claude, en otra sesión, cuando el usuario lo
  pida; skill `subir-dependencia`): primero los apuntes del mes de
  facturación (`entries/MonthEntries.tsx`), luego el catálogo de listados
  (`CatalogPage`).
- **Probarla en pantalla** (del usuario): nadie la ha visto aún en navegador.
- documentos sube a la 0.2.11 cuando se toque.

## Trampas vigentes

- **Tabla/Excel**: write-excel-file pasa las `Date` a serial en UTC: darle
  `Date.UTC` del día, no la medianoche de Madrid. `Intl` es-ES no agrupa
  4 cifras: `useGrouping: 'always'`. En tests, ` ` escapado (oxlint
  prohíbe el literal) y Testing Library lo normaliza a espacio. Un
  `SxProps<Theme>` no cabe en un array de `sx`: objetos `as const`.

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
  Cloud Build solo recibe la carpeta de la aplicación, no esta. (Para probar
  en local un `.tgz` sin publicar, README, *Probar un cambio…*.)
