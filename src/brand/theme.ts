import { alpha, createTheme } from '@mui/material/styles'

/**
 * Material Design con los colores del AMPA, sacados de los píxeles del logo
 * (assets/logo-ampa.png), no a ojo.
 *
 * Se usa Material porque es la interfaz que la gente ya conoce de Android y de
 * las aplicaciones de Google: el botón redondo de acción, las tarjetas, los
 * avisos de colores. Nadie tiene que aprender nada nuevo.
 *
 * Es el único tema de la suite: toda aplicación del AMPA tiene que parecer la
 * misma casa. Si una necesita un color nuevo, se añade aquí y lo tienen todas.
 *
 * Desde la 0.2.1, con algo más de relieve (pedido por el usuario el
 * 25/09/2026: «que no se vea todo tan plano»): las tarjetas flotan con una
 * sombra suave sobre un fondo algo más frío, los botones son de pastilla y más
 * altos, como en Material 3, y los diálogos más redondeados. Todo desde aquí,
 * para que cambien a la vez todas las aplicaciones.
 */
export const BRAND_RED = '#E22333'
export const BRAND_NAVY = '#424C76'

/** Sombra de las tarjetas: dos capas muy suaves, teñidas del azul de la marca. */
const CARD_SHADOW = `0 1px 2px ${alpha(BRAND_NAVY, 0.08)}, 0 4px 12px ${alpha(BRAND_NAVY, 0.08)}`

type ButtonColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

/** El color de un botón; "inherit" (o ninguno) cuenta como el primario. */
function buttonColor(color: string | undefined): ButtonColor {
  return color === undefined || color === 'inherit' ? 'primary' : (color as ButtonColor)
}

export const theme = createTheme({
  palette: {
    // Blanco sobre este rojo da un contraste de 4,6:1: pasa el mínimo WCAG AA (4,5).
    primary: { main: BRAND_RED },
    secondary: { main: BRAND_NAVY },
    // Un gris con un punto de azul: las tarjetas blancas destacan más que
    // sobre el gris neutro de antes.
    background: { default: '#F1F2F7', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    // Material 3 ya no pone los botones en mayúsculas.
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Reserva siempre el hueco de la barra de desplazamiento: así la página
        // no salta de lado al abrir un desplegable o al cambiar a una pantalla
        // más larga. Venía del index.css de facturación.
        html: { scrollbarGutter: 'stable' },
      },
    },
    // Tarjetas con sombra suave en vez de borde. Una tarjeta dentro de un
    // diálogo puede seguir pidiendo variant="outlined" y sale con borde.
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ ownerState }) =>
          ownerState.variant === 'outlined'
            ? {}
            : { boxShadow: CARD_SHADOW, border: `1px solid ${alpha(BRAND_NAVY, 0.06)}` },
      },
    },
    // Botones de pastilla y con altura de Material 3 (40 px): se ven y se
    // pulsan mejor, sobre todo en el móvil.
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
        sizeMedium: { minHeight: 40, paddingLeft: 20, paddingRight: 20 },
        sizeLarge: { minHeight: 48, paddingLeft: 28, paddingRight: 28, fontSize: '1rem' },
        // Los rellenos, con una sombra de su propio color en vez de la gris.
        contained: ({ theme, ownerState }) => {
          const main = theme.palette[buttonColor(ownerState.color)].main
          return {
            boxShadow: `0 1px 3px ${alpha(main, 0.3)}`,
            '&:hover': { boxShadow: `0 3px 10px ${alpha(main, 0.35)}` },
          }
        },
        // Los de borde, con el borde de su color y un fondo muy tenue.
        outlined: ({ theme, ownerState }) => {
          const main = theme.palette[buttonColor(ownerState.color)].main
          return {
            borderColor: alpha(main, 0.35),
            backgroundColor: alpha(main, 0.04),
            '&:hover': { backgroundColor: alpha(main, 0.1), borderColor: main },
          }
        },
      },
    },
    // El botón redondo, con la sombra de su color: rojo para entrar, azul
    // para salir en fichajes.
    MuiFab: {
      styleOverrides: {
        primary: { boxShadow: `0 4px 14px ${alpha(BRAND_RED, 0.35)}` },
        secondary: { boxShadow: `0 4px 14px ${alpha(BRAND_NAVY, 0.35)}` },
      },
    },
    // Diálogos más redondeados, como en Material 3, salvo a pantalla completa.
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
  },
})
