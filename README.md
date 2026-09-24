# @ampa/ui

Lo común del frontal de las aplicaciones del AMPA (fichajes, listados,
facturación y las que vengan): el **tema**, el **logo**, la **cabecera**, la
**entrada con Google**, el **diálogo de confirmación** y el **cliente de la
API**.

Nace el 24/09/2026 porque ya había **tres copias** de todo esto: la de fichajes
y la de listados idénticas, y la de facturación empezando a separarse. Tres
copias se mantienen igual dos semanas; después, cada arreglo se hace en una y
se olvida en las otras.

**Sin monorepo** (decisión del usuario): cada aplicación sigue en su
repositorio y tira de esta librería fijando una versión.

---

## Qué hay dentro

| | |
|---|---|
| `SuiteRoot` | Envuelve la aplicación en su `main.tsx`: tema, normalización de estilos y sesión. Recibe el `SuiteApp` (nombre, dirección del portal y, solo en el portal, el cliente de Google). |
| `SessionGate` | La puerta: pregunta `GET /api/me` y, con sesión, le pasa a la aplicación `{ user, onUnauthorized, signOut }`; sin ella, al portal a entrar (o, en el portal, el botón de Google). Tabla completa en *Pasar de la 0.1 a la 0.2*. |
| `AppShell` | La barra: logo, nombre de la aplicación, quién ha entrado, botón de salir y pestañas opcionales. `maxWidth` para las pantallas de tablas. |
| `ConfirmDialog` | Preguntar antes de lo que no se deshace. Junta las tres versiones que había. |
| `apiRequest`, `apiDownload`, `ApiError`, `messageOf` | Hablar con el servidor: JSON o formulario con ficheros, errores con su código y los mensajes del servidor tal cual. La sesión va sola, en la cookie. |
| `saveFile` | Guardar en el disco un fichero descargado con `apiDownload`. |
| `theme`, `BRAND_RED`, `BRAND_NAVY`, `AMPA_LOGO` | La marca, por si una pantalla la necesita suelta. |
| `useAuth`, `useSuiteApp` | Para lo raro; lo normal es no necesitarlos. |

### El contrato con el servidor

Desde la 0.2.0, toda aplicación que use `SessionGate` tiene estas rutas, y se
las pone el cliente del portal (`ampa-portal/cliente`), no la aplicación:

- `GET /api/me` → `{ name, email, … }`, con la cookie de la suite. Quién ha
  entrado y, si la aplicación lo necesita, qué puede hacer (fichajes añade
  `isEmployee` e `isAdmin`: `SessionGate<SessionUser & { isAdmin: boolean }>`).
  401 sin sesión, 403 sin acceso a esta aplicación.
- `POST /api/auth/salir` → borra la cookie.

`POST /api/auth/google` con `{ credential }` solo existe en el portal: canjea
la credencial de Google por la cookie. (Hasta la 0.1, cada aplicación tenía
esa ruta y devolvía un token que se guardaba en el navegador.)

### Lo que se ha dejado fuera, a propósito

- **Las fuentes.** Son CSS, y un CSS dentro de un paquete de `node_modules` no
  lo puede cargar Node al correr los tests de la aplicación. Cada `main.tsx`
  importa las tres de Roboto (ver *Usarla en una aplicación*).
- **La configuración de Vite y de Vitest** (`setup.ts`). Son veinte líneas por
  aplicación, casi siempre iguales, pero meterlas aquí ataría la librería a la
  versión exacta de Vite y Vitest de cada aplicación. Si empiezan a separarse,
  se reconsidera.
- **`MonthNavigator`** (fichajes y facturación tienen uno cada uno) y el
  resto de componentes de pantalla. Se suben aquí cuando dos aplicaciones
  necesiten **el mismo**, no antes: adivinar qué será común sale peor que
  esperar a verlo.
- **La librería de gráficos** de las estadísticas: cuando se elija, se elige
  para la suite y probablemente viva aquí.

---

## Por qué se distribuye así

Hacía falta que la instalaran sin fricción tres sitios: el contenedor de
desarrollo (`node:22-alpine`), la construcción de producción en Cloud Build
(`gcloud run deploy --source .`, que ejecuta el `Dockerfile`) y cualquier
integración continua futura. Se probaron y descartaron, el 24/09/2026:

- **GitHub Packages.** Su documentación dice que hace falta un token *para
  instalar* incluso los paquetes públicos. Sería un secreto más en Cloud Build,
  justo lo que la hoja de ruta (punto 3b) intenta evitar.
- **`"@ampa/ui": "github:ampa-sainz-vicuna/ampa-ui#v0.1.0"`**, lo más obvio.
  Necesita `git` dentro del contenedor, y `node:22-alpine` no lo trae
  (comprobado: falla con *"An unknown git error occurred"*). Y aun
  instalándolo, el lockfile apunta a `git+ssh://`, que en Cloud Build no tiene
  clave con la que entrar.
- **npmjs.com.** Funcionaría, pero es una cuenta más, con su 2FA y su token de
  publicación, para un paquete que solo usa el AMPA.

Lo elegido: **repositorio público en GitHub y el paquete construido, colgado en
cada release.** La aplicación lo instala por URL:

```json
"@ampa/ui": "https://github.com/ampa-sainz-vicuna/ampa-ui/releases/download/v0.1.0/ampa-ui-0.1.0.tgz"
```

- **Sin credenciales en ningún sitio**: ni en Docker, ni en Cloud Build.
- **Sin `git`**: es una descarga normal, comprobado en `node:22-alpine`.
- **El lockfile guarda el hash** (`integrity: sha512-…`) del paquete: si el
  fichero de la release cambiara, `npm ci` se negaría a instalarlo.
- **Se instala compilado** (JavaScript + tipos), no el código fuente: así ni
  Vite ni Vitest ni `tsc` de la aplicación tienen que saber que es TypeScript.

**¿Por qué público?** Porque no hay nada que esconder: son colores, una barra y
un botón de Google. El ID del cliente de Google no está aquí (lo pone cada
aplicación, y además es público por diseño) y no hay datos ni secretos. Las
aplicaciones, que sí tienen reglas del AMPA, siguen siendo privadas. Hacerlo
privado obligaría a meter un token en Cloud Build.

---

## Usarla en una aplicación

`main.tsx`:

```tsx
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import { SuiteRoot, type SuiteApp } from '@ampa/ui'

const app: SuiteApp = {
  name: 'Listados del AMPA',
  // Donde se entra. En desarrollo, http://localhost:5176 (el portal levantado).
  portalUrl: import.meta.env.VITE_PORTAL_URL,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SuiteRoot app={app}>
      <App />
    </SuiteRoot>
  </StrictMode>,
)
```

`App.tsx`:

```tsx
export default function App() {
  return <SessionGate>{(session) => <Workspace {...session} />}</SessionGate>
}

function Workspace({ user, onUnauthorized, signOut }: Session<SessionUser>) {
  return (
    <AppShell userName={user.name} onSignOut={signOut} tabs={…}>
      …
    </AppShell>
  )
}
```

La aplicación necesita, además de `@ampa/ui`: `react`, `react-dom`,
`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` y
`@fontsource/roboto`. Ya no necesita `@types/google.accounts`.

Listados es el ejemplo completo (en la 0.1; pasará a la 0.2 al adoptar el
portal). El portal (`ampa-portal/web`) es el único que lleva `google` en su
`SuiteApp`.

### Pasar de la 0.1 a la 0.2 (el portal del AMPA)

Desde la 0.2.0 se entra en **el portal** y la sesión es **una cookie de toda
la suite** que el JavaScript no ve (diseño en la
[hoja de ruta, 4a](../ampa-fichajes/docs/hoja-de-ruta.md)). Solo tiene sentido
cuando el servidor de la aplicación ya usa el cliente del portal
(`ampa-portal/cliente`): las dos cosas van juntas. En cada aplicación:

1. **`SuiteApp`**: fuera `storageKey`, `googleClientId` y `hostedDomain`;
   dentro `portalUrl`. En `web/.env`, `VITE_PORTAL_URL=http://localhost:5176`
   (y en producción `https://portal.ampasainzvicuna.com`); fuera
   `VITE_GOOGLE_CLIENT_ID` y `VITE_GOOGLE_HOSTED_DOMAIN`.
2. **Fuera el `token`**: ya no viene en `Session` ni se pasa a `apiRequest` /
   `apiDownload`. TypeScript señala cada sitio; es borrarlo, y borrarlo de las
   props por las que viajaba.
3. **Tests**: nada de `sessionStorage['….token']` ni de `fakeJwt`. Con sesión
   es que `GET /api/me` conteste 200; sin sesión, que conteste 401 (y entonces
   `SessionGate` manda al portal: el test lo ve como un enlace "Entrar en el
   portal del AMPA").

Lo que hace `SessionGate` desde la 0.2.0, según lo que conteste `GET /api/me`:

| | en una aplicación | en el portal |
|---|---|---|
| 200 | la aplicación | lo mismo |
| 401 | al portal, con `?volver=` para que la devuelva aquí | el botón de Google |
| 403 | "no tienes acceso", con el camino al portal | lo mismo |
| otro | la barra con el error y "Reintentar" | lo mismo |

Salir (`POST /api/auth/salir`) borra la cookie: sale de **toda** la suite.

---

## Desarrollo

Todo en Docker, como las aplicaciones. No hay pantalla propia: se prueba con
los tests y dentro de una aplicación.

```bash
docker compose run --rm node npm ci
docker compose run --rm node npm test
docker compose run --rm node npm run lint
docker compose run --rm node npm run typecheck
docker compose run --rm node npm pack          # construye y deja ampa-ui-X.Y.Z.tgz
docker compose run --rm node node scripts/logo.mjs   # solo si cambia el logo
```

### Probar un cambio en una aplicación antes de publicarlo

Las aplicaciones montan esta carpeta en su contenedor de Node, en `/ampa-ui`
(ver su `docker-compose.yml`), así que pueden instalar el paquete recién
construido sin publicar nada:

```bash
# En ampa-ui:
docker compose run --rm node npm pack

# En la aplicación (por ejemplo, ampa-listados):
docker compose exec node npm install file:../ampa-ui/ampa-ui-0.2.0.tgz
docker compose restart node        # Vite vuelve a preparar las dependencias
docker compose exec node npm test
```

Esto cambia `package.json` y `package-lock.json` de la aplicación. **No se
hace commit así**: una vez publicada la versión, se instala desde la URL de la
release (ver abajo) y eso es lo que se sube. Un `file:` en el `package.json`
rompería la construcción en Cloud Build, que no tiene esta carpeta.

### Publicar una versión

1. Subir `version` en `package.json` siguiendo semver: `0.1.1` para un arreglo,
   `0.2.0` para algo nuevo o que obliga a cambiar las aplicaciones. (Mientras
   empiece por 0, cualquier cambio de la segunda cifra puede romper.)
2. `docker compose run --rm node npm install` para que el `package-lock.json`
   recoja la versión.
3. Commit, etiqueta y push:

   ```bash
   git commit -am "Versión 0.2.0: …"
   git tag v0.2.0
   git push && git push --tags
   ```

4. La Action *Publicar versión* hace el resto. Se ve en la pestaña **Actions**
   del repositorio; al terminar, la release aparece en **Releases** con el
   `.tgz` adjunto.
5. En cada aplicación que la quiera:

   ```bash
   docker compose exec node npm install https://github.com/ampa-sainz-vicuna/ampa-ui/releases/download/v0.2.0/ampa-ui-0.2.0.tgz
   ```

   Y sus tests, su build y su commit, como cualquier otro cambio.

Una versión publicada **no se reescribe**: si sale mal, se publica otra. Las
aplicaciones tienen el hash en su lockfile y dejarían de instalar.
