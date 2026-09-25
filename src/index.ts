/**
 * Lo que una aplicación de la suite puede usar de @ampa/ui. Lo que no está
 * aquí es interno y puede cambiar sin avisar.
 */

// La marca
export { AMPA_LOGO } from './brand/logo.ts'
export { BRAND_NAVY, BRAND_RED, theme } from './brand/theme.ts'

// La aplicación
export { SuiteRoot } from './app/SuiteRoot.tsx'
export { useSuiteApp, type SuiteApp } from './app/suiteApp.ts'

// La sesión
export { useAuth, type AuthState, type SessionUser } from './auth/authContext.ts'
export { SessionGate, type Session } from './auth/SessionGate.tsx'

// El marco y los diálogos
export { AppShell } from './shell/AppShell.tsx'
export { CardTitle } from './shell/CardTitle.tsx'
export { ConfirmDialog } from './shell/ConfirmDialog.tsx'

// La API
export { ApiError, apiDownload, apiRequest, messageOf, type DownloadedFile, type RequestOptions } from './api/client.ts'
export { saveFile } from './api/saveFile.ts'
