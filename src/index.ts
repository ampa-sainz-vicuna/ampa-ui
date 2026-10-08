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
export { useAuth, type AuthState, type SessionUser, type SuiteLink } from './auth/authContext.ts'
export { SessionGate, type Session } from './auth/SessionGate.tsx'
export { useSessionUser } from './auth/sessionUserContext.ts'

// El marco y los diálogos
export { AppShell } from './shell/AppShell.tsx'
export { ApplicationIcon } from './shell/ApplicationIcon.tsx'
export { CardTitle } from './shell/CardTitle.tsx'
export { ConfirmDialog } from './shell/ConfirmDialog.tsx'

// La API
export { ApiError, apiDownload, apiRequest, messageOf, type DownloadedFile, type RequestOptions } from './api/client.ts'
export { saveFile } from './api/saveFile.ts'

// Adjuntar desde Documentos (desde la 0.2.8)
export { DocumentPicker } from './documents/DocumentPicker.tsx'
export { documentsUrlOf, type PickedDocument, type PickedFolder } from './documents/documentsApi.ts'

// La tabla común: buscar, filtrar, ordenar y exportar a Excel (desde la 0.2.11)
export { DataTable, type DataTableSort } from './table/DataTable.tsx'
export { formatCell, type CellValue, type ColumnType, type DataTableColumn, type HideBelow } from './table/columns.ts'
export { exportXlsx } from './table/exportXlsx.ts'
// Sin tildes ni mayúsculas, para buscar: «Cómo» → «como». Tres aplicaciones
// tienen hoy su propia copia de esta función.
export { normalize as normalizeForSearch } from './help/search.ts'
