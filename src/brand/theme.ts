import { alpha, createTheme } from '@mui/material/styles'
import { CLICK_TO_CHOOSE } from './clickToChoose.ts'

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
 * altos, como en Material 3, y los diálogos más redondeados.
 *
 * Desde la 0.2.4, un lavado de cara «sin que pierda la esencia» (pedido por el
 * usuario el 28/09/2026): los mismos colores, la misma letra y las mismas
 * piezas, con los detalles de una interfaz de hoy. Títulos algo más gruesos y
 * apretados, esquinas más redondas, campos de texto con un anillo de color al
 * escribir, avisos con un borde de su color, menús y globos de ayuda
 * redondeados, la barra translúcida y un velo azul difuminado detrás de los
 * diálogos. Todo desde aquí, para que cambien a la vez todas las aplicaciones.
 */
export const BRAND_RED = '#E22333'
export const BRAND_NAVY = '#424C76'

/** El texto: casi negro con un punto del azul de la marca, en vez del negro puro. */
const INK = '#1F2433'

/** El azul casi negro de los globos de ayuda, los avisos flotantes y el velo de los diálogos. */
const DEEP = '#1B2033'

/** Sombra de las tarjetas: dos capas muy suaves, teñidas del azul de la marca. */
const CARD_SHADOW = `0 1px 2px ${alpha(BRAND_NAVY, 0.06)}, 0 6px 16px ${alpha(BRAND_NAVY, 0.07)}`

/** Sombra de lo que flota por encima de todo: menús, desplegables, diálogos. */
const FLOATING_SHADOW = `0 4px 12px ${alpha(BRAND_NAVY, 0.1)}, 0 16px 40px ${alpha(BRAND_NAVY, 0.14)}`

/** El borde de casi todo: el azul de la marca, muy rebajado. */
const HAIRLINE = alpha(BRAND_NAVY, 0.1)

type ButtonColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

/** El color de un botón; "inherit" (o ninguno) cuenta como el primario. */
function buttonColor(color: string | undefined): ButtonColor {
  return color === undefined || color === 'inherit' ? 'primary' : (color as ButtonColor)
}

/**
 * Títulos: más gruesos y con las letras algo más juntas. 700 y no 600: las
 * aplicaciones cargan Roboto en 400, 500 y 700 (su main.tsx), y un 600 el
 * navegador lo pinta con la de 700 igualmente.
 */
const heading = { fontWeight: 700, letterSpacing: '-0.01em' }

export const theme = createTheme({
  palette: {
    // Blanco sobre este rojo da un contraste de 4,6:1: pasa el mínimo WCAG AA (4,5).
    primary: { main: BRAND_RED },
    secondary: { main: BRAND_NAVY },
    // Un gris con un punto de azul: las tarjetas blancas destacan más que
    // sobre el gris neutro.
    background: { default: '#F3F4F8', paper: '#FFFFFF' },
    text: { primary: INK, secondary: alpha(INK, 0.66) },
    divider: HAIRLINE,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: { ...heading, fontSize: '1.125rem' },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    // Material 3 ya no pone los botones en mayúsculas.
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
    overline: { fontWeight: 500, letterSpacing: '0.08em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Reserva siempre el hueco de la barra de desplazamiento: así la página
        // no salta de lado al abrir un desplegable o al cambiar a una pantalla
        // más larga. Venía del index.css de facturación.
        html: { scrollbarGutter: 'stable' },
        body: {
          // Un halo muy suave de los dos colores de la marca arriba del todo,
          // detrás de la barra: da profundidad sin que se note que está.
          backgroundImage: [
            `radial-gradient(1100px 380px at 10% -140px, ${alpha(BRAND_RED, 0.09)}, transparent 70%)`,
            `radial-gradient(1100px 380px at 90% -140px, ${alpha(BRAND_NAVY, 0.12)}, transparent 70%)`,
          ].join(', '),
          backgroundRepeat: 'no-repeat',
        },
        '::selection': { backgroundColor: alpha(BRAND_RED, 0.18) },
      },
    },
    // La barra de arriba (AppShell, color="inherit"): blanca y algo
    // translúcida, con lo de debajo difuminado al desplazarse.
    MuiAppBar: {
      styleOverrides: {
        colorInherit: {
          backgroundColor: alpha('#FFFFFF', 0.86),
          backdropFilter: 'saturate(180%) blur(14px)',
        },
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
            : { borderRadius: 16, boxShadow: CARD_SHADOW, border: `1px solid ${alpha(BRAND_NAVY, 0.07)}` },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: HAIRLINE },
      },
    },
    // Botones de pastilla y con altura de Material 3 (40 px): se ven y se
    // pulsan mejor, sobre todo en el móvil. Al pulsarlos se hunden un pelo.
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: 'background-color 150ms, box-shadow 150ms, border-color 150ms, transform 100ms',
          '&:active': { transform: 'scale(0.98)' },
        },
        sizeMedium: { minHeight: 40, paddingLeft: 20, paddingRight: 20 },
        sizeLarge: { minHeight: 48, paddingLeft: 28, paddingRight: 28, fontSize: '1rem' },
        // Los rellenos, con una sombra de su propio color en vez de la gris.
        contained: ({ theme, ownerState }) => {
          const main = theme.palette[buttonColor(ownerState.color)].main
          return {
            boxShadow: `0 1px 2px ${alpha(main, 0.25)}, 0 2px 6px ${alpha(main, 0.2)}`,
            '&:hover': { boxShadow: `0 2px 4px ${alpha(main, 0.25)}, 0 6px 16px ${alpha(main, 0.3)}` },
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
        root: { textTransform: 'none' },
        primary: { boxShadow: `0 4px 14px ${alpha(BRAND_RED, 0.35)}` },
        secondary: { boxShadow: `0 4px 14px ${alpha(BRAND_NAVY, 0.35)}` },
      },
    },
    // Campos de texto con fondo blanco y, al escribir, un anillo suave del
    // rojo de la marca además del borde.
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          transition: 'box-shadow 150ms',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(BRAND_NAVY, 0.22) },
          '&:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(BRAND_NAVY, 0.5),
          },
          '&.Mui-focused:not(.Mui-error)': { boxShadow: `0 0 0 4px ${alpha(BRAND_RED, 0.12)}` },
          '&.Mui-focused.Mui-error': { boxShadow: `0 0 0 4px ${alpha(theme.palette.error.main, 0.12)}` },
          '&.Mui-disabled': { backgroundColor: alpha(BRAND_NAVY, 0.03) },
        }),
      },
    },
    // Pestañas: la raya de debajo más gruesa y con las puntas redondas, y
    // las que no están elegidas, en gris hasta que se pasa por encima.
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: '3px 3px 0 0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 500,
          minHeight: 48,
          transition: 'color 150ms',
          '&:not(.Mui-selected):hover': { color: theme.palette.text.primary },
        }),
      },
    },
    // Diálogos más redondeados, como en Material 3, salvo a pantalla completa,
    // y con el fondo velado en azul y un poco difuminado en vez de en gris.
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24, boxShadow: FLOATING_SHADOW },
        paperFullScreen: { borderRadius: 0 },
        backdrop: { backgroundColor: alpha(DEEP, 0.4), backdropFilter: 'blur(3px)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, letterSpacing: '-0.01em' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '8px 24px 20px' } },
    },
    // Menús y desplegables: redondeados, con borde fino y sombra suave.
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: 14, border: `1px solid ${HAIRLINE}`, boxShadow: FLOATING_SHADOW },
      },
    },
    // El clic que abre un desplegable no elige una opción (ver clickToChoose.ts).
    MuiMenu: {
      defaultProps: CLICK_TO_CHOOSE,
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { borderRadius: 8, marginLeft: 6, marginRight: 6 },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 14, border: `1px solid ${HAIRLINE}`, boxShadow: FLOATING_SHADOW },
      },
    },
    // Los globos de ayuda, del azul casi negro de la marca y redondeados.
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: alpha(DEEP, 0.92), borderRadius: 8, fontSize: '0.75rem', padding: '6px 10px' },
        arrow: { color: alpha(DEEP, 0.92) },
      },
    },
    // Avisos con un borde fino de su color: se leen como una tarjeta más.
    MuiAlert: {
      styleOverrides: {
        standard: ({ theme, ownerState }) => ({
          border: `1px solid ${alpha(theme.palette[ownerState.severity ?? 'success'].main, 0.25)}`,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        outlined: { borderColor: alpha(BRAND_NAVY, 0.2) },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999 },
        bar: { borderRadius: 999 },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: DEEP },
      },
    },
  },
})
